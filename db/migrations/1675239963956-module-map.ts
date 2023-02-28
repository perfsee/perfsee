import { MigrationInterface, QueryRunner } from 'typeorm'

export class moduleMap1675239963956 implements MigrationInterface {
  name = 'moduleMap1675239963956'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`artifact\` ADD \`module_map_key\` varchar(255) NULL`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP COLUMN \`module_map_key\``)
  }
}
