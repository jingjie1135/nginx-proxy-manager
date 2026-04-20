import { migrate as logger } from "../logger.js";

const migrateName = "override-host";

/**
 * 迁移 - 为 proxy_host 表添加目标域名覆写字段
 *
 * @param   {Object}  knex
 * @returns {Promise}
 */
const up = (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	return knex.schema
		.alterTable("proxy_host", (table) => {
			// 覆写目标域名：非空时自动启用 Lua Host 伪装 + SNI 穿透
			table.string("forward_host_override", 255).notNull().defaultTo("");
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host table updated with forward_host_override`);
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
			table.dropColumn("forward_host_override");
		})
		.then(() => {
			logger.info(`[${migrateName}] proxy_host table reverted`);
		});
};

export { up, down };
