import { info, getState } from "@actions/core";
import * as fs from "fs";
import * as path from "path";
import { absoluteCacheDirectory, logFileName } from "./utils/constants";

const pid = Number.parseInt(getState("pidToKill"));

info("Server pid: " + pid);

try {
  if (!isNaN(pid)) {
    process.kill(pid);
  }
} catch (err) {
  console.error(err);
}

try {
  const logFilePath = path.join(absoluteCacheDirectory, logFileName);
  if (fs.existsSync(logFilePath)) {
    info("Server logs:");
    info(
      fs.readFileSync(logFilePath, {
        encoding: "utf8",
        flag: "r",
      })
    );
  }
} catch (err) {
  console.error(err);
}
