#!/usr/bin/env node

import inquirer from "inquirer";
import chalk from "chalk";
import { importCSV } from "../cli/commands/importCsv.js";
import { previewCSV } from "../cli/commands/previewCSV.js";
import { sendEmails } from "../cli/commands/sendEmails.js";
import { scheduleEmail } from '../cli/commands/scheduleEmail.js';
import { sendConfirmations } from "../cli/commands/sendConfirmations.js";
import { checkData } from "../cli/commands/checkData.js";
import { viewStats } from "../cli/commands/viewStats.js";

import spinner from "./components/spinner.js";
import log from "./components/logger.js";
import {
  dynamicCountdown,
  isServerRunning,
  displayCommands,
} from "./components/utils.js";
import runServer from "./components/server.js";
import checkHealth from "./components/healthCheck.js";

const processCommandArgs = async () => {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) return false;

  switch (command) {
    case "import":
      await importCSV();
      return true;
    case "preview":
      await previewCSV();
      return true;
    case "send":
      await sendEmails();
      return true;
    case "schedule":
      await scheduleEmail();
      return true;
    case "check data":
      await checkData();
      return true;
    case "send confirmation":
      await sendConfirmations();
      return true;
    case "view stats":
      await viewStats();
      return true;
    case "server":
      await runServer();
      return true;
    case "health":
      await checkHealth();
      return true;
    case "help":
      displayCommands();
      return true;
    default:
      console.log(chalk.red(`Unknown command: ${command}`));
      console.log(chalk.yellow("Run 'availr help' for available commands"));
      return true;
  }
};

const main = async () => {
  try {
    const commandProcessed = await processCommandArgs();
    if (commandProcessed) {
      process.exit(0);
    }
    console.clear();
    console.log(chalk.bold.cyan("\nAVAILR CLI\n"));
    console.log(chalk.white("Welcome to Availr!\n"));
    let running = true;
    while (running) {
      console.clear();
      spinner.start("Checking server status...");
      const serverRunning = await isServerRunning();
      spinner.stop();
      await new Promise((resolve) => setTimeout(resolve, 300));
      const serverStatus = serverRunning
        ? chalk.green("online")
        : chalk.red("offline");
      console.log(chalk.bold.cyan("\nAVAILR CLI"));
      console.log(`Server: ${serverStatus}\n`);
      const { action } = await inquirer.prompt([
        {
          type: "list",
          name: "action",
          message: "What would you like to do?",
          choices: [
            { name: "Import CSV", value: "Import CSV" },
            { name: "Preview CSV", value: "Preview CSV" },
            { name: "Send Emails", value: "Send Emails" },
            { name: "Schedule Emails", value: "Schedule Emails" },
            { name: "Check Data", value: "Check Data" },
            { name: "Send Confirmations", value: "Send Confirmations" },
            { name: "View Stats", value: "View Stats" },
            {
              name: serverRunning
                ? `Start Server ${chalk.green("(running)")}`
                : "Start Server",
              value: "Start Server",
            },
            { name: "Health Check", value: "Health Check" },
            { name: "Help", value: "Help" },
            { name: "Restart CLI", value: "Restart CLI" },
            { name: "Exit", value: "Exit" },
          ],
        },
      ]);
      switch (action.split(" ")[0] === "Start" ? "Start Server" : action) {
        case "Import CSV":
          spinner.start("Preparing to import CSV...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          spinner.stop();
          try {
            await importCSV();
          } catch (error) {
            log.error(`Import failed: ${error.message}`);
            console.log(
              chalk.yellow("\nCSV import operations can be resource intensive.")
            );
            await dynamicCountdown(5, "Returning to main menu in");
          }
          break;
        case "Send Emails":
          spinner.start("Preparing email service...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          spinner.stop();
          await sendEmails();
          break;

        case "Preview CSV":
          try {
            await previewCSV("test.csv");  
          } catch (err) {
            console.log(chalk.red("❌ Error previewing CSV:"), err.message);
          }
          break;
        
        case "Schedule Emails":
          await scheduleEmail();
          break;

        case "Check Data":
          spinner.start("Loading Data...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          spinner.stop();
          await checkData();
          break;
        case "Send Confirmations":
          spinner.start("Sending confirmations...");
          await new Promise((resolve) => setTimeout(resolve, 500));
          spinner.stop();
          await sendConfirmations();
          break;
        case "View Stats":
          try {
           spinner.start("Loading statistics...");
           await new Promise((r) => setTimeout(r, 500));
           spinner.stop();

          await viewStats("test.csv");
        } catch (err) {
           console.error(chalk.red(`❌ Failed to view stats: ${err.message}`));
        }
        break;

        case "Start Server":
          await runServer();
          await new Promise((resolve) => setTimeout(resolve, 500));
          break;
        case "Health Check":
          await checkHealth();
          break;
        case "Help":
          log.header("COMMAND REFERENCE");
          displayCommands();
          break;
        case "Restart CLI":
          log.warning("Restarting CLI...");
          await new Promise((resolve) => setTimeout(resolve, 1000));
          console.clear();
          running = false;
          setImmediate(() => main());
          return;
        case "Exit":
          await new Promise((resolve) => setTimeout(resolve, 1000));
          log.info("Goodbye!");
          process.exit(0);
        default:
          log.error("Unknown command. Please try again.");
      }

      console.log(chalk.gray("\nPress any key to continue..."));
      await new Promise((resolve) => {
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.once("data", () => {
          process.stdin.setRawMode(false);
          resolve();
        });
      });
    }
  } catch (error) {
    console.error(chalk.red(`\nError: ${error.message}`));

    await dynamicCountdown(3);
    console.clear();
    main();
  }
};

process.on("uncaughtException", (err) => {
  console.error(chalk.red(`\nUnexpected error: ${err.message}`));
  console.log(chalk.yellow("CLI will restart shortly..."));

  const restartTime = err.code === "ENOENT" ? 5 : 3;
  setTimeout(() => main(), restartTime * 1000);
});

main().catch((error) => {
  console.error(chalk.red(`\nFatal error: ${error.message}`));
  process.exit(1);
});
