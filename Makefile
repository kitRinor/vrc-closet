# makefile
.DEFAULT_GOAL := help
.PHONY : help
help:   # show this list
	@echo "---- list of available commands ---"
	@grep -E '^[[:alnum:]_/-]+ *:.*?#.*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?# "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
# ----

.PHONY : run
run:   # run the application
	@echo "Running the application..."
	@pnpm run dev

.PHONY : db-start db-stop
db-start:   # start the local database (using Docker)
	@echo "Starting the local database..."
	@npx supabase start
db-stop:   # stop the local database (using Docker)
	@echo "Stopping the local database..."
	@npx supabase stop

.PHONY : db-push db-seed
db-push:   # push the database schema to the database
	@echo "Pushing the database schema..."
	@pnpm --filter @repo/db run db:push
db-seed:	 # delete existing rows and seed the database with initial data
	@echo "Seeding the database..."
	@pnpm --filter @repo/db run db:seed