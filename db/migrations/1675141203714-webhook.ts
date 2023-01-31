import { MigrationInterface, QueryRunner } from 'typeorm'

export class webhook1675141203714 implements MigrationInterface {
  name = 'webhook1675141203714'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`webhook\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` varchar(255) NOT NULL, \`project_id\` int NULL, \`user_id\` int NULL, \`url\` varchar(1024) NOT NULL, \`secret\` varchar(255) NULL, \`method\` varchar(255) NOT NULL DEFAULT 'POST', \`event_type\` varchar(1024) NOT NULL, UNIQUE INDEX \`idx_f707b8cf5e56d69bb8fac17c9b\` (\`uuid\`), INDEX \`idx_95bc3b4bf6b329b6c6dd2ed217\` (\`project_id\`), INDEX \`idx_b0dcfcc8c95edc2232ea8e9771\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`webhook\` ADD CONSTRAINT \`FK_95bc3b4bf6b329b6c6dd2ed2174\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`webhook\` ADD CONSTRAINT \`FK_b0dcfcc8c95edc2232ea8e97710\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`webhook\` DROP FOREIGN KEY \`FK_b0dcfcc8c95edc2232ea8e97710\``)
    await queryRunner.query(`ALTER TABLE \`webhook\` DROP FOREIGN KEY \`FK_95bc3b4bf6b329b6c6dd2ed2174\``)
    await queryRunner.query(`DROP INDEX \`idx_b0dcfcc8c95edc2232ea8e9771\` ON \`webhook\``)
    await queryRunner.query(`DROP INDEX \`idx_95bc3b4bf6b329b6c6dd2ed217\` ON \`webhook\``)
    await queryRunner.query(`DROP INDEX \`idx_f707b8cf5e56d69bb8fac17c9b\` ON \`webhook\``)
    await queryRunner.query(`DROP TABLE \`webhook\``)
  }
}
