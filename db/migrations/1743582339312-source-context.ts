import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1743582339312 implements MigrationInterface {
  name = 'Migrations1743582339312'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD \`source_context_key\` varchar(255) NULL COMMENT 'storage key for source context'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP COLUMN \`source_context_key\``)
  }
}
