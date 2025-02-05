import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1738744990656 implements MigrationInterface {
  name = 'Migrations1738744990656'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`application_setting\` ADD \`enable_midscene\` tinyint NOT NULL DEFAULT 0`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`application_setting\` DROP COLUMN \`enable_midscene\``)
  }
}
