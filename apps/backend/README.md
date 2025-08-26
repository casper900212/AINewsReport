# Backend template

## Init development

1. make .env file `cp .example.env .env`

## Run in development

1. `npm install`
2. `npm run start:dev`

## Use typeorm for development

1. set `TYPEORM_SYNCHRONIZE=true` in `.env` file.
2. set `TYPEORM_LOGGING=true` in `.env` file if need.

## Use typeorm migration for release

1. delete all table in releaser environment.
2. run `npm run migration:run` to run migration.
3. run `npm run migration:generate <VersionName>` to generate migration file with script.
4. commit and push the migration file that you created.
5. Congratulations! well done!

## Another typeorm commands in develop

1. run `NODE_ENV=development npm run migration:create <FileName>` to create empty migration.
2. run `NODE_ENV=development npm run migration:drop` to drop all table.
3. run `NODE_ENV=development npm run migration:seed` to seed test data into table.
