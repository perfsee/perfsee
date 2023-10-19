import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1737628330988 implements MigrationInterface {
  name = 'Migrations1737628330988'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`user_cookies\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`cookie_storage_key\` varchar(255) NULL, INDEX \`idx_4179cdff5ef150dd37d9f3a803\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_cookies\` ADD CONSTRAINT \`FK_4179cdff5ef150dd37d9f3a803f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`cookie_target_type\` tinyint NOT NULL COMMENT 'type of whose personal cookies will be used' DEFAULT '0'`,
    )
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD \`cookie_target\` varchar(255) NULL COMMENT 'whose personal cookies will be used'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`cookie_target\``)
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`cookie_target_type\``)
    await queryRunner.query(`ALTER TABLE \`user_cookies\` DROP FOREIGN KEY \`FK_4179cdff5ef150dd37d9f3a803f\``)
    await queryRunner.query(`DROP INDEX \`idx_4179cdff5ef150dd37d9f3a803\` ON \`user_cookies\``)
    await queryRunner.query(`DROP TABLE \`user_cookies\``)
  }
}
