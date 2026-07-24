import { runMigrations } from "./index";

runMigrations()
  .then(() => console.log("Migrations applied."))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
