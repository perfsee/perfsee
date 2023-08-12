/*
Copyright 2022 ByteDance and/or its affiliates.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import { Readable } from 'stream'

import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  S3Client,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import debugFactory from 'debug'
import { from, mergeMap } from 'rxjs'

import { BaseObjectStorage } from './provider'

const debug = debugFactory('perfsee:s3-obj-storage')

export interface S3Config {
  region: string
  aws_s3_bucket: string
  aws_access_key_id: string
  aws_secret_access_key: string
  aws_s3_endpoint?: string
}

const chunk = (arr: string[], chunkSize = 1000, cache: string[][] = []) => {
  while (arr.length) {
    cache.push(arr.splice(0, chunkSize))
  }
  return cache
}

export class S3Storage extends BaseObjectStorage {
  bucket: string
  client: S3Client
  constructor(s3config: S3Config) {
    super()
    const { region, aws_s3_bucket, aws_access_key_id, aws_secret_access_key, aws_s3_endpoint } = s3config
    if (!aws_s3_bucket) {
      throw new Error(`aws_s3_bucket is required`)
    }
    if (!aws_access_key_id) {
      throw new Error(`aws_access_key_id is required`)
    }
    if (!aws_secret_access_key) {
      throw new Error(`aws_secret_access_key is required`)
    }
    this.bucket = aws_s3_bucket
    this.client = new S3Client({
      region,
      credentials: {
        accessKeyId: aws_access_key_id,
        secretAccessKey: aws_secret_access_key,
      },
      ...(aws_s3_endpoint ? { endpoint: aws_s3_endpoint } : {}),
      forcePathStyle: true,
    })
  }
  async get(name: string): Promise<Buffer> {
    debug(`Getting ${name} from s3 storage...`)
    const getObject = new GetObjectCommand({
      Bucket: this.bucket,
      Key: name,
    })
    const result = await this.client.send(getObject)
    if (result.Body) {
      return Buffer.from(await result.Body.transformToByteArray())
    }
    debug(`Object ${name} not found from s3 storage`)
    throw new Error(`Object ${name} not found`)
  }
  async getStream(name: string): Promise<Readable> {
    debug(`Getting ${name} stream from s3 storage...`)
    const getObject = new GetObjectCommand({
      Bucket: this.bucket,
      Key: name,
    })
    const result = await this.client.send(getObject)
    if (result.Body) {
      return result.Body as Readable
    }
    debug(`Object ${name} not found from s3 storage`)
    throw new Error(`Object ${name} not found`)
  }
  async upload(name: string, buf: Buffer): Promise<void> {
    debug(`Uploading ${name} to s3 storage...`)
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: name,
        Body: buf,
      },
      queueSize: 5,
      partSize: 1024 * 1024 * 5,
    })
    const result = await upload
      .done()
      .then((v) => {
        debug(`Upload ${name} to s3 storage, result: ${JSON.stringify(v.$metadata)}`)
      })
      .catch((err) => {
        debug(`Upload ${name} to s3 storage failed: ${err}`)
      })
    debug(`Upload ${name} to s3 storage, result: ${JSON.stringify(result)}`)
  }
  async uploadFile(name: string, file: string): Promise<void> {
    debug(`Uploading ${name} filepath: ${file} to s3 storage...`)
    const upload = new Upload({
      client: this.client,
      params: {
        Bucket: this.bucket,
        Key: name,
        Body: file,
      },
      queueSize: 5,
      partSize: 1024 * 1024 * 5,
    })
    const result = await upload.done()
    debug(`Upload ${name} to s3 storage, result: ${JSON.stringify(result)}`)
  }
  async delete(name: string): Promise<void> {
    const deleteObject = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: name,
    })
    const result = await this.client.send(deleteObject)
    debug(`Delete ${name} from s3 storage, result: ${JSON.stringify(result)}`)
  }
  async bulkDelete(name: string[]): Promise<void> {
    if (name.length < 1000) {
      const deleteObjects = new DeleteObjectsCommand({
        Bucket: this.bucket,
        Delete: {
          Objects: name.map((n) => ({ Key: n })),
          Quiet: true,
        },
      })
      const result = await this.client.send(deleteObjects)
      debug(`Bulk delete from s3 storage, result: ${JSON.stringify(result)}`)
      return
    }
    return new Promise((resolve, reject) => {
      const chunks = chunk(name)
      from(chunks)
        .pipe(mergeMap((chunk) => this.bulkDelete(chunk), 3))
        .subscribe({
          error: (err) => {
            reject(err)
          },
          complete: () => {
            resolve()
          },
        })
    })
  }
  async deleteFolder(name: string): Promise<void> {
    const list: string[] = []
    let continuationToken: string | undefined
    const listObjects = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: name,
      Delimiter: '/',
      MaxKeys: 1000,
    })
    const result = await this.client.send(listObjects)
    if (result.KeyCount && result.KeyCount <= 1000) {
      const keys = result.Contents?.map((content) => {
        if (content.Key) {
          return content.Key
        }
      }).filter(Boolean) as string[]
      return this.bulkDelete(keys)
    } else if (result.KeyCount) {
      continuationToken = result.NextContinuationToken
      while (continuationToken) {
        const listObjects = new ListObjectsV2Command({
          Bucket: this.bucket,
          Prefix: name,
          Delimiter: '/',
          MaxKeys: 1000,
          ContinuationToken: continuationToken,
        })
        const result = await this.client.send(listObjects)
        if (result.KeyCount) {
          result.Contents?.forEach((content) => {
            if (content.Key) {
              list.push(content.Key)
            }
          })
        }
        continuationToken = result.NextContinuationToken
      }
      return this.bulkDelete(list)
    }
  }
}
