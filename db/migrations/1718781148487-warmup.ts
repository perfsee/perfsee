import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1718781148487 implements MigrationInterface {
  name = 'Migrations1718781148487'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` ADD \`warmup\` tinyint NOT NULL COMMENT 'warmup' DEFAULT 0`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` DROP COLUMN \`warmup\``)
  }
}
