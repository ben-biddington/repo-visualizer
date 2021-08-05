import React from 'react';
import ReactDOMServer from 'react-dom/server';
import { program } from 'commander';
import path  = require('path');
import { Tree } from "./Tree"
import { processDir } from './process-dir';
import fs from "fs"

export interface Log {
  trace: (m: string) => void;
  debug: (m: string) => void;
  info: (m: string) => void;
}

class DevNullLog implements Log {
  public trace: (m: string) => void = () => {};
  public debug: (m: string) => void = () => {};
  public info: (m: string) => void = () => {};
}

class ConsoleLog implements Log {
  public trace: (m: string) => void = (m) => console.trace(m);
  public debug: (m: string) => void = (m) => console.debug(m);
  public info: (m: string) => void = (m) => console.info(m);
}

export type Options = {
  srcDir: string;
  outputFile: string;
  dryRun: boolean;
  log?: Log;
}

// npm run build-cli
// node cli.js path/to/dir
const run = async ({ srcDir, outputFile, dryRun = false, log = new DevNullLog()}: Options) => {
  const directory = path.resolve(srcDir);

  log.debug(`Running on directory <${directory}> and writing to <${outputFile}>`);

  // [i] ignores are relative to `srcDir`
  const ignores = [ '.git', 'node_modules' ]

  log.debug(`Ignoring folders <${ignores}>`);

  log.info(`Starting run on dir <${directory}>`);

  console.log = () => {};

  const tree = await processDir(directory, ignores);

  const componentCodeString = ReactDOMServer.renderToStaticMarkup(
    <Tree data={tree} filesChanged={[]} />
  );

  if (false === dryRun) {
    await fs.writeFileSync(outputFile, componentCodeString)
  } else {
    log.info(`Not saving file to <${outputFile}>`);
  }
}

program.
  version('0.0.1').
  command("run <srcDir> <outputFile>").
  option("-d --dryRrun"             , "Dry run only").
  option("-v --verbose"             , "Enable verbose logging").
  action((srcDir, outputFile, cmd) => {
    return run({srcDir, outputFile, dryRun: cmd.dryRrun, log: new ConsoleLog()});
  });

program.parse(process.argv);