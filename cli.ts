#!/usr/bin/env node
import prettyBytes from "pretty-bytes"
import cacheinfo from "./index.js"

for await (const { name, size } of cacheinfo()) {
  console.log(name, prettyBytes(size))
}
