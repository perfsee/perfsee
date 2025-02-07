import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1738914262184 implements MigrationInterface {
  name = 'Migrations1738914262184'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD \`size\` json NULL COMMENT 'total size of all assets in this artifact, in bytes'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP COLUMN \`size\``)
  }
}
