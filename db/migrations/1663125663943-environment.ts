import { MigrationInterface, QueryRunner } from 'typeorm'

export class environment1663125663943 implements MigrationInterface {
  name = 'environment1663125663943'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` ADD \`local_storage\` json NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`environment\` DROP COLUMN \`local_storage\``)
  }
}
