import { migrate as logger } from "../logger.js";

const migrateName = "load-balancing";

/**
 * 迁移 - 为 proxy_host 表添加负载均衡相关字段
 *
 * @param   {Object}  knex
 * @returns {Promise}
 */
const up = (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	return knex.schema
		.alterTable("proxy_host", (table) => {
			// 上游服务器列表（JSON 数组），每项包含 scheme/server/port/weight
			table.json("upstream_servers").notNull().defaultTo("[]");
			// 负载均衡算法：round_robin / least_conn / ip_hash
			table.string("load_balance_method", 30).notNull().defaultTo("round_robin");
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host table updated with upstream_servers and load_balance_method`);
		});
};

/**
 * 回滚迁移
 *
 * @param   {Object}  knex
 * @returns {Promise}
 */
const down = (knex) => {
	logger.info(`[${migrateName}] Migrating Down...`);

	return knex.schema
		.alterTable("proxy_host", (table) => {
			table.dropColumn("upstream_servers");
			table.dropColumn("load_balance_method");
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host table reverted`);
		});
};

export { up, down };
