import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1720680575607 implements MigrationInterface {
  name = 'Migrations1720680575607'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` ADD \`lighthouse_flags\` json NULL COMMENT 'lighthouse flags'`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` DROP COLUMN \`lighthouse_flags\``)
  }
}
