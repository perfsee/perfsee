import { MigrationInterface, QueryRunner } from 'typeorm'

export class jobExtra1666250880517 implements MigrationInterface {
  name = 'jobExtra1666250880517'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` ADD \`extra\` json NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`job\` DROP COLUMN \`extra\``)
  }
}
