#![deny(clippy::all)]

use std::collections::HashMap;
use std::mem;
use std::pin::Pin;
use std::thread::spawn;
use std::vec::Vec;
use std::{
  fs, io,
  sync::{self, Arc},
};

use async_stream::stream;
use bytes::Bytes;
use core::task::{Context, Poll};
use futures::{future::TryFutureExt, stream::Stream};
use http::header::CONTENT_TYPE;
use http::header::HOST;
use http::Uri;
use http::{Method, StatusCode};
use hyper::client::Client;
use hyper::http::{HeaderValue, Version};
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, HeaderMap, Request, Response, Server};
use hyper_tls::HttpsConnector;
use napi_derive::{js_function, module_exports};
use once_cell::sync::OnceCell;
use rustls::internal::pemfile;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::mpsc;
use tokio::sync::{
  mpsc::{unbounded_channel, UnboundedReceiver, UnboundedSender},
  Mutex,
};
use tokio_rustls::server::TlsStream;
use tokio_rustls::TlsAcceptor;

#[cfg(all(
  unix,
  not(target_env = "musl"),
  not(target_arch = "aarch64"),
  not(target_arch = "arm"),
  not(debug_assertions)
))]
#[global_allocator]
static ALLOC: jemallocator::Jemalloc = jemallocator::Jemalloc;

#[cfg(all(windows, target_arch = "x86_64", not(debug_assertions)))]
#[global_allocator]
static ALLOC: mimalloc::MiMalloc = mimalloc::MiMalloc;

type SharedCache = Arc<Mutex<HashMap<Uri, (StatusCode, HeaderMap, Bytes)>>>;
type SharedAPICaptured = Arc<Mutex<HashMap<(Uri, StatusCode, Bytes), Bytes>>>;
type SharedAPICache = Arc<Mutex<HashMap<(Uri, Bytes), (StatusCode, HeaderMap, Bytes)>>>;

static GLOBAL_CACHE: OnceCell<SharedCache> = OnceCell::new();
static GLOBAL_API_CAPTURED: OnceCell<SharedAPICaptured> = OnceCell::new();
static GLOBAL_API_CACHE: OnceCell<SharedAPICache> = OnceCell::new();

#[module_exports]
fn init(mut exports: napi::JsObject) -> napi::Result<()> {
  let _ = GLOBAL_CACHE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));
  let _ = GLOBAL_API_CACHE.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));
  let _ = GLOBAL_API_CAPTURED.get_or_init(|| Arc::new(Mutex::new(HashMap::new())));
  exports.create_named_method("startServer", start_server)?;
  exports.create_named_method("clearCache", clear_cache)?;
  Ok(())
}

#[js_function(1)]
fn start_server(ctx: napi::CallContext) -> napi::Result<napi::JsUndefined> {
  let cb = ctx.get::<napi::JsFunction>(0)?;
  let callback = ctx.env.create_threadsafe_function(
    &cb,
    0,
    |ctx: napi::threadsafe_function::ThreadSafeCallContext<()>| {
      ctx
        .env
        .get_undefined()
        .map(|js_undefined| vec![js_undefined])
    },
  )?;
  let (tx, rx) = unbounded_channel::<napi::threadsafe_function::ThreadsafeFunction<usize>>();
  create_tokio_rt(callback, rx)?;
  ctx.env.set_instance_data(
    tx,
    None,
    |cx: napi::FinalizeContext<
      UnboundedSender<napi::threadsafe_function::ThreadsafeFunction<usize>>,
      Option<u8>,
    >| {
      mem::drop(cx);
    },
  )?;
  ctx.env.get_undefined()
}

#[js_function(1)]
fn clear_cache(ctx: napi::CallContext) -> napi::Result<napi::JsUndefined> {
  let cb = ctx.get::<napi::JsFunction>(0)?;
  let sender = ctx
    .env
    .get_instance_data::<UnboundedSender<napi::threadsafe_function::ThreadsafeFunction<usize>>>()?
    .ok_or_else(|| {
      napi::Error::new(
        napi::Status::GenericFailure,
        "Call startServer first".to_owned(),
      )
    })?;
  let clear_callback = ctx.env.create_threadsafe_function(
    &cb,
    1usize,
    |cx: napi::threadsafe_function::ThreadSafeCallContext<usize>| {
      cx.env.create_uint32(cx.value as u32).map(|ud| vec![ud])
    },
  )?;
  sender
    .send(clear_callback)
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, format!("{}", e)))?;

  ctx.env.get_undefined()
}

fn create_tokio_rt(
  cb: napi::threadsafe_function::ThreadsafeFunction<()>,
  mut rx: UnboundedReceiver<napi::threadsafe_function::ThreadsafeFunction<usize>>,
) -> Result<(), napi::Error> {
  let (shutdown_sender, shutdown_receiver) = mpsc::channel::<()>(1);
  let tokio_rt = tokio::runtime::Builder::new_multi_thread()
    .enable_all()
    .build()
    .map_err(|e| napi::Error::new(napi::Status::GenericFailure, format!("{}", e)))?;
  spawn(move || {
    tokio_rt.spawn(async move {
      while let Some(tsfn) = rx.recv().await {
        let global_cache = GLOBAL_CACHE.get().unwrap().clone();
        let mut guard = global_cache.lock().await;
        let cache_len = guard.len();
        println!("Cleared {} of cache", guard.len());
        guard.clear();
        mem::drop(guard);

        let global_cache = GLOBAL_API_CACHE.get().unwrap().clone();
        let mut guard = global_cache.lock().await;
        let cache_len = cache_len + guard.len();
        println!("Cleared {} of API cache", guard.len());
        guard.clear();
        mem::drop(guard);

        let global_cache = GLOBAL_API_CAPTURED.get().unwrap().clone();
        let mut guard = global_cache.lock().await;
        guard.clear();
        mem::drop(guard);

        tsfn.call(
          Ok(cache_len),
          napi::threadsafe_function::ThreadsafeFunctionCallMode::Blocking,
        );
        if let Err(e) = shutdown_sender.send(()).await {
          eprintln!("{:?}", e);
        }
      }
    });
    tokio_rt.block_on(async {
      if let Err(e) = run_server(shutdown_receiver).await {
        cb.call(
          Err(napi::Error::new(
            napi::Status::GenericFailure,
            format!("Start proxy failed: {}", e),
          )),
          napi::threadsafe_function::ThreadsafeFunctionCallMode::Blocking,
        );
      }
    });
  });
  Ok(())
}

fn error(err: String) -> io::Error {
  io::Error::new(io::ErrorKind::Other, err)
}

async fn run_server(
  mut shutdown_receiver: mpsc::Receiver<()>,
) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
  let addr = "127.0.0.1:443".to_owned();
  // Build TLS configuration.
  let tls_cfg = {
    // Load public certificate.
    let certs = load_certs("certs/cert.pem")?;
    // Load private key.
    let key = load_private_key("certs/key.pem")?;
    // Do not use client certificate authentication.
    let mut cfg = rustls::ServerConfig::new(rustls::NoClientAuth::new());
    // Select a certificate to use.
    cfg
      .set_single_cert(certs, key)
      .map_err(|e| error(format!("{}", e)))?;
    // Configure ALPN to accept HTTP/2, HTTP/1.1 in that order.
    cfg.set_protocols(&[b"h2".to_vec(), b"http/1.1".to_vec()]);
    sync::Arc::new(cfg)
  };

  let global_cache = GLOBAL_CACHE.get().unwrap();
  let global_api_captured = GLOBAL_API_CAPTURED.get().unwrap();
  let global_api_cache = GLOBAL_API_CACHE.get().unwrap();

  // Create a TCP listener via tokio.
  let tcp = TcpListener::bind(&addr).await?;
  let tls_acceptor = TlsAcceptor::from(tls_cfg);
  // Prepare a long-running future stream to accept and serve clients.
  let incoming_tls_stream = stream! {
    loop {
      let (socket, _) = tcp.accept().await?;
      let stream = tls_acceptor.accept(socket).map_err(|e| {
        println!("[!] Voluntary server halt due to client-connection error...");
        // Errors could be handled here, instead of server aborting.
        // Ok(None)
        error(format!("TLS Error: {:?}", e))
      });
      yield stream.await;
    }
  };
  let https = HttpsConnector::new();
  let http_client = Arc::new(
    Client::builder()
      .http2_only(false)
      .build::<_, hyper::Body>(https),
  );
  let server = Server::builder(HyperAcceptor {
    acceptor: Box::pin(incoming_tls_stream),
  })
  .serve(make_service_fn(
    move |_socket: &tokio_rustls::server::TlsStream<tokio::net::TcpStream>| {
      let global_cache = global_cache.clone();
      let global_api_captured = global_api_captured.clone();
      let global_api_cache = global_api_cache.clone();
      let http_client = http_client.clone();
      async move {
        let http_client = http_client.clone();
        let global_cache = global_cache.clone();
        let global_api_captured = global_api_captured.clone();
        let global_api_cache = global_api_cache.clone();
        Ok::<_, io::Error>(service_fn(move |mut req: Request<Body>| {
          let http_client = http_client.clone();
          let global_cache = global_cache.clone();
          let global_api_captured = global_api_captured.clone();
          let global_api_cache = global_api_cache.clone();
          async move {
            let req_uri = req.uri().clone();
            let guard = global_cache.lock().await;
            if let Some((status_code, headers, cache)) = (*guard).get(&req_uri) {
              if let Ok(mut res) = Response::builder()
                .status(status_code)
                .body(Body::from(cache.clone()))
              {
                let _ = mem::replace(res.headers_mut(), headers.clone());
                println!("Resource [{}] hit the cache", req_uri);
                return Ok(res);
              }
            }
            mem::drop(guard);

            let req_body = mem::replace(req.body_mut(), Body::empty());
            let req_bytes = hyper::body::to_bytes(req_body).await?;
            let guard = global_api_cache.lock().await;
            if let Some((status, headers, res_body)) =
              (*guard).get(&(req_uri.clone(), req_bytes.clone()))
            {
              if let Ok(mut res) = Response::builder()
                .status(status)
                .body(Body::from(res_body.clone()))
              {
                let _ = mem::replace(res.headers_mut(), headers.clone());
                println!("Resource [{}] hit the API cache", req_uri);
                return Ok(res);
              }
            }
            let req_body = Body::from(req_bytes.clone());
            let _ = mem::replace(req.body_mut(), Body::from(req_bytes.clone()));
            mem::drop(guard);

            let mut cached_res = Response::new(Body::empty());
            let mut rewrite_req = Request::new(Body::empty());

            *req.version_mut() = Version::HTTP_11;
            mem::swap(rewrite_req.body_mut(), req.body_mut());
            mem::swap(rewrite_req.headers_mut(), req.headers_mut());
            mem::swap(rewrite_req.method_mut(), req.method_mut());
            let host = req
              .uri()
              .authority()
              .map(|a| a.as_str())
              .unwrap_or("")
              .to_owned();

            mem::swap(rewrite_req.uri_mut(), req.uri_mut());

            rewrite_req
              .headers_mut()
              .insert(HOST, HeaderValue::from_str(host.as_str()).unwrap());
            let mut res = http_client.request(rewrite_req).await.map_err(|e| {
              eprintln!("Request [{:?}] error {}", req_uri, e);
              e
            })?;

            let res_body = mem::replace(res.body_mut(), Body::empty());
            let res_bytes = hyper::body::to_bytes(res_body).await?;
            mem::swap(cached_res.headers_mut(), res.headers_mut());
            mem::swap(cached_res.status_mut(), res.status_mut());

            // static resources
            if cached_res.status().is_success()
              && (req_uri.path().ends_with(".js")
                || req_uri.path().ends_with(".css")
                || req_uri.path().ends_with(".png")
                || req_uri.path().ends_with(".svg")
                || req_uri.path().ends_with(".woff")
                || req_uri.path().ends_with(".woff2")
                || req_uri.path().ends_with(".ttf")
                || req_uri.path().ends_with(".ico")
                || req_uri.path().ends_with(".gif")
                || req_uri.path().ends_with(".jpg")
                || req_uri.path().ends_with(".jpeg")
                || req_uri.path().ends_with(".webp")
                || req_uri.path().ends_with(".json")
                || req_uri.path().ends_with(".wasm")
                || cached_res
                  .headers()
                  .get(CONTENT_TYPE)
                  .and_then(|v| v.to_str().ok())
                  .map(|v| v.contains("text/html"))
                  .unwrap_or(false))
            {
              println!("Put [{}] into cache", req_uri);
              let mut guard = global_cache.lock().await;
              (*guard).insert(
                req_uri,
                (
                  cached_res.status(),
                  cached_res.headers().clone(),
                  res_bytes.slice(0..res_bytes.len()),
                ),
              );
              let _ = mem::replace(cached_res.body_mut(), Body::from(res_bytes));
              mem::drop(guard);
            } else {
              if req.method() == Method::GET {
                // non-static request
                let mut guard = global_api_captured.lock().await;
                let res_bytes_inner = res_bytes.slice(0..res_bytes.len());
                let req_bytes = hyper::body::to_bytes(req_body).await?;
                if let Some(cached_res_body) =
                  (*guard).get(&(req_uri.clone(), cached_res.status(), req_bytes.clone()))
                {
                  if cached_res_body == &res_bytes_inner {
                    println!("Put [{}] into API cache", req_uri);
                    let mut api_cache_guard = global_api_cache.lock().await;
                    (*api_cache_guard).insert(
                      (req_uri, req_bytes),
                      (
                        cached_res.status(),
                        cached_res.headers().clone(),
                        res_bytes_inner,
                      ),
                    );
                    mem::drop(api_cache_guard);
                  }
                } else {
                  (*guard).insert((req_uri, cached_res.status(), req_bytes), res_bytes_inner);
                }
                mem::drop(guard);
              }

              let _ = mem::replace(cached_res.body_mut(), Body::from(res_bytes));
            }
            Ok::<_, hyper::Error>(cached_res)
          }
        }))
      }
    },
  ))
  .with_graceful_shutdown(async {
    shutdown_receiver.recv().await;
    println!("Shutdown...");
  });

  // Run the future, keep going until an error occurs.
  println!("Starting to serve on https://{}.", addr);
  server.await?;
  Ok(())
}

struct HyperAcceptor<'a> {
  acceptor: Pin<Box<dyn Stream<Item = Result<TlsStream<TcpStream>, io::Error>> + 'a>>,
}

impl hyper::server::accept::Accept for HyperAcceptor<'_> {
  type Conn = TlsStream<TcpStream>;
  type Error = io::Error;

  fn poll_accept(
    mut self: Pin<&mut Self>,
    cx: &mut Context,
  ) -> Poll<Option<Result<Self::Conn, Self::Error>>> {
    Pin::new(&mut self.acceptor).poll_next(cx)
  }
}

// Load public certificate from file.
fn load_certs(filename: &str) -> io::Result<Vec<rustls::Certificate>> {
  // Open certificate file.
  let certfile =
    fs::File::open(filename).map_err(|e| error(format!("failed to open {}: {}", filename, e)))?;
  let mut reader = io::BufReader::new(certfile);

  // Load and return certificate.
  pemfile::certs(&mut reader).map_err(|_| error("failed to load certificate".into()))
}

// Load private key from file.
fn load_private_key(filename: &str) -> io::Result<rustls::PrivateKey> {
  // Open keyfile.
  let keyfile =
    fs::File::open(filename).map_err(|e| error(format!("failed to open {}: {}", filename, e)))?;
  let mut reader = io::BufReader::new(keyfile);

  // Load and return a single private key.
  let mut keys = pemfile::pkcs8_private_keys(&mut reader)
    .map_err(|_| error("failed to load private key".into()))?;
  if keys.len() != 1 {
    return Err(error("expected a single private key".into()));
  }
  Ok(keys.remove(0))
}
