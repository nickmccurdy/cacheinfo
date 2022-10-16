# `cacheinfo`

Info about your JavaScript package manager cache sizes

## Usage

### CLI

```
npx cacheinfo
```

### Library

`cacheinfo` is a function that returns a `ReadableStream<[string, number]>`

```ts
import cacheinfo from "cacheinfo"

for await (const [name, size] of cacheinfo()) {
  // ...
}
```

## Example

```
npm ... MB
pnpm ... MB
yarn ... MB
berry ... MB
```
