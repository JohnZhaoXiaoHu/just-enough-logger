import Logger, { ILoggerOptions } from "../src";
import fs from "fs";
import { resolve } from "path";

jest.mock("fs");
let originalConsole = global.console;

global.console = {
  ...global.console,
  info: jest.fn(str => str),
  warn: jest.fn(str => str),
  error: jest.fn(str => str),
};

describe("All Tests", () => {
  test("creates a log file if doesn't exist", () => {
    let options: ILoggerOptions = {
      transports: ["file", "console"],
    };
    new Logger(options);
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.openSync).toHaveBeenCalled();
  });

  test("only uses specified transports", () => {
    let fileLogger = new Logger({
      transports: ["file"],
    });

    fileLogger.info("Test Message");
    expect(fs.existsSync).toHaveBeenCalled();
    expect(fs.openSync).toHaveBeenCalled();
    expect(fs.appendFileSync).toHaveBeenCalled();

    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();

    (fs.existsSync as jest.Mock).mockReset();
    (fs.openSync as jest.Mock).mockReset();
    (fs.appendFileSync as jest.Mock).mockReset();

    let consoleLogger = new Logger({
      transports: ["console"],
    });

    consoleLogger.info("Test Message");
    consoleLogger.warn("Test Message");
    consoleLogger.error("Test Message");

    expect(fs.existsSync).not.toHaveBeenCalled();
    expect(fs.openSync).not.toHaveBeenCalled();
    expect(fs.appendFileSync).not.toHaveBeenCalled();

    expect(console.info).toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  test("creates a log file at given path", () => {
    let logFilePath = resolve(__dirname, "test.log");
    new Logger({
      file: logFilePath,
    });

    expect(fs.existsSync).toHaveBeenCalledWith(logFilePath);
    expect(fs.openSync).toHaveBeenCalledWith(logFilePath, "w");
  });

  test("does not create same log file more than once", () => {
    let logFilePath = resolve(__dirname, "test.log");

    fs.existsSync = jest
      .fn()
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);

    new Logger({
      file: logFilePath,
    });

    new Logger({
      file: logFilePath,
    });

    expect(fs.existsSync).toHaveBeenCalledTimes(2);
    expect(fs.openSync).toHaveBeenCalledTimes(1);
  });

  test("returns correct log file path", () => {
    let defaultFilePath = resolve(process.cwd(), "log.log");
    let customFilePath = resolve(__dirname, "test.log");

    let logger = new Logger();
    expect(logger.getLogFilePath()).toBe(defaultFilePath);

    let customFileLogger = new Logger({
      file: customFilePath,
    });

    expect(customFileLogger.getLogFilePath()).toBe(customFilePath);
  });

  test("prints to console with correct level", () => {
    let logger = new Logger({
      transports: ["console"],
    });

    let message = "Test message";
    logger.info(message);
    let infoMessage = logger.formatter(message, "info");
    logger.warn(message);
    let warnMessage = logger.formatter(message, "warn");
    logger.error(message);
    let errorMessage = logger.formatter(message, "error");

    expect(console.info).toHaveBeenCalledWith(infoMessage);
    expect(console.warn).toHaveBeenCalledWith(warnMessage);
    expect(console.error).toHaveBeenCalledWith(errorMessage);
  });

  test("logs to file with correct level", () => {
    let logFilePath = resolve(__dirname, "test.log");

    let logger = new Logger({
      transports: ["file"],
      file: logFilePath,
    });

    let message = "Test message";
    logger.info(message);
    let infoMessage = logger.formatter(message, "info");
    logger.warn(message);
    let warnMessage = logger.formatter(message, "warn");
    logger.error(message);
    let errorMessage = logger.formatter(message, "error");

    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, infoMessage);
    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, warnMessage);
    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, errorMessage);
  });

  test("prints on both transports", () => {
    let logFilePath = resolve(__dirname, "test.log");

    let logger = new Logger({
      transports: ["console", "file"],
      file: logFilePath,
    });

    let message = "Test message";
    logger.info(message);
    let infoMessage = logger.formatter(message, "info");
    logger.warn(message);
    let warnMessage = logger.formatter(message, "warn");
    logger.error(message);
    let errorMessage = logger.formatter(message, "error");

    expect(console.info).toHaveBeenCalledWith(infoMessage);
    expect(console.warn).toHaveBeenCalledWith(warnMessage);
    expect(console.error).toHaveBeenCalledWith(errorMessage);

    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, infoMessage);
    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, warnMessage);
    expect(fs.appendFileSync).toHaveBeenCalledWith(logFilePath, errorMessage);
  });

  test("prints with custom format", () => {
    let logFilePath = resolve(__dirname, "test.log");

    let logger = new Logger({
      file: logFilePath,
    });

    let format = (message: string, level: "info" | "warn" | "error") => {
      return `${level}:${message}`;
    };

    logger.formatter = format;

    let message = "test message";

    logger.info("test message");
    logger.warn("test message");
    logger.error("test message");

    expect(fs.appendFileSync).toHaveBeenCalledWith(
      logFilePath,
      format(message, "info")
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      logFilePath,
      format(message, "warn")
    );
    expect(fs.appendFileSync).toHaveBeenCalledWith(
      logFilePath,
      format(message, "error")
    );

    expect(console.info).toHaveBeenCalledWith(format(message, "info"));
    expect(console.warn).toHaveBeenCalledWith(format(message, "warn"));
    expect(console.error).toHaveBeenCalledWith(format(message, "error"));
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
    console = originalConsole;
  });
});
