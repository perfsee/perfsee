import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1691139914711 implements MigrationInterface {
  name = 'Migrations1691139914711'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` ADD \`enable_proxy\` tinyint NOT NULL DEFAULT 0`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`profile\` DROP COLUMN \`enable_proxy\``)
  }
}
