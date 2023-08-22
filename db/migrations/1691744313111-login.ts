import { MigrationInterface, QueryRunner } from 'typeorm'

export class Migrations1691744313111 implements MigrationInterface {
  name = 'Migrations1691744313111'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` ADD \`login_script\` text NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`login_script\``)
  }
}
