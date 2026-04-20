import { migrate as logger } from "../logger.js";

const migrateName = "override-host-to-boolean";

/**
 * 修复迁移 - 将 forward_host_override 从 string 改为 boolean
 * 
 * 前一次迁移 (20260420090000) 已在部署环境中以 string 类型创建了该列。
 * 修改迁移源文件不会导致重新运行，因此需要这个新迁移来：
 * 1. 将已有的字符串值（""/"0" → 0, 其他 → 1）转为整数
 * 2. 重建列为 boolean 类型
 *
 * @param   {Object}  knex
 * @returns {Promise}
 */
const up = async (knex) => {
	logger.info(`[${migrateName}] Migrating Up...`);

	// 检测当前列的类型信息（SQLite 不支持 ALTER COLUMN，需要特殊处理）
	const isSqlite = knex.client.config.client === "better-sqlite3" || knex.client.config.client === "sqlite3";

	if (isSqlite) {
		// SQLite：直接 UPDATE 将空字符串/非真值设为 0，非空设为 1
		// SQLite 的 boolean 底层用整数存储，无需改列类型
		await knex.raw(`
			UPDATE proxy_host
			SET forward_host_override = CASE
				WHEN forward_host_override = '' THEN 0
				WHEN forward_host_override = '0' THEN 0
				WHEN forward_host_override = 'false' THEN 0
				WHEN forward_host_override IS NULL THEN 0
				ELSE CAST(forward_host_override AS INTEGER)
			END
		`);
	} else {
		// MySQL/PostgreSQL：先清洗数据再改列类型
		await knex.raw(`
			UPDATE proxy_host
			SET forward_host_override = CASE
				WHEN forward_host_override = '' THEN 0
				WHEN forward_host_override = '0' THEN 0
				WHEN forward_host_override = 'false' THEN 0
				WHEN forward_host_override IS NULL THEN 0
				ELSE 1
			END
		`);
		await knex.schema.alterTable("proxy_host", (table) => {
			table.boolean("forward_host_override").notNull().defaultTo(false).alter();
		});
	}

	logger.info(`[${migrateName}] forward_host_override column converted to boolean`);
};

/**
 * 回滚迁移
 *
 * @param   {Object}  knex
 * @returns {Promise}
 */
const down = async (knex) => {
	logger.info(`[${migrateName}] Migrating Down...`);
	// 回退无需恢复为 string，保持 boolean 即可
	logger.info(`[${migrateName}] No-op rollback`);
};

export { up, down };
