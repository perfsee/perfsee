# `@perfsee/sdk`

> Perfsee command line tools

## Installation

```
npm install -g @perfsee/sdk
```

## Usage

### Take snapshot

Take a snapshot for all pages of the project.

```
perfsee take-snapshot -p <your-project-id> --token <your-access-token>
```

This command requires the project id from `-p, --project` and the access token
from `--token` or environment variable `PERFSEE_TOKEN`, you can create the token
from [https://perfsee.com/access-token](https://perfsee.com/access-token).

You can filter the pages by appending page names to the command.

For example take a snapshot for `Home Page` and `User Page`:

```
perfsee take-snapshot -p <your-project-id> --token <your-access-token> "Home Page" "User Page"
```

## License

This project is licensed under the [Apache-2.0 License](LICENSE).
