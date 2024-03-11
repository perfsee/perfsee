import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1710125623556 implements MigrationInterface {
  name = 'Migrations1710125623556'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` ADD \`user_agent\` text NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` DROP COLUMN \`user_agent\``)
  }
}
