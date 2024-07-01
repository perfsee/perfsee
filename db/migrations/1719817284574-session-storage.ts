import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1719817284574 implements MigrationInterface {
  name = 'Migrations1719817284574'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` ADD \`session_storage\` json NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`session_storage\``)
  }
}
