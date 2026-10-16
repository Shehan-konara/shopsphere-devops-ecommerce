# Architecture notes

- **Frontend:** React + Vite; responsive storefront.
- **API:** Node.js + Express REST API.
- **Database:** MySQL 8.4, initialized by `database/init.sql`.
- **Reverse proxy:** Nginx exposes a single public HTTP port (8080).
- **Networking:** only Nginx publishes a host port; database and API are private on the Compose network.
- **Persistence:** named Docker volume `mysql_data`.
- **Health:** backend checks DB connectivity; Compose waits for DB health before starting API.
- **Orders:** API reloads product prices from DB and performs stock checks/decrements in a transaction. Client-sent prices are never trusted.
