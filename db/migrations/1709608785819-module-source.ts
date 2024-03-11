import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1709608785819 implements MigrationInterface {
  name = 'Migrations1709608785819'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD \`module_source_key\` varchar(255) NULL COMMENT 'storage key for module source'`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP COLUMN \`module_source_key\``)
  }
}
