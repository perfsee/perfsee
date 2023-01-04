import { MigrationInterface, QueryRunner } from 'typeorm'

export class group1675758535885 implements MigrationInterface {
  name = 'group1675758535885'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(100) NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`idx_d3240eaf64d34439513e46cb49\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`project_group\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`group_id\` int NOT NULL, INDEX \`idx_ffbce6a59e3bb90fa35224f7ec\` (\`group_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_group_permission\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`group_id\` int NOT NULL, \`permission\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_c4df58a6a7c64143d7685ab02d\` (\`user_id\`), INDEX \`idx_a26c366b81deab243e1082a8ba\` (\`group_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`project_group\` ADD CONSTRAINT \`FK_f2b5c987c8e4700c911d2b4d289\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`project_group\` ADD CONSTRAINT \`FK_ffbce6a59e3bb90fa35224f7ec0\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_group_permission\` ADD CONSTRAINT \`FK_c4df58a6a7c64143d7685ab02d2\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_group_permission\` ADD CONSTRAINT \`FK_a26c366b81deab243e1082a8ba0\` FOREIGN KEY (\`group_id\`) REFERENCES \`group\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user_group_permission\` DROP FOREIGN KEY \`FK_a26c366b81deab243e1082a8ba0\``)
    await queryRunner.query(`ALTER TABLE \`user_group_permission\` DROP FOREIGN KEY \`FK_c4df58a6a7c64143d7685ab02d2\``)
    await queryRunner.query(`ALTER TABLE \`project_group\` DROP FOREIGN KEY \`FK_ffbce6a59e3bb90fa35224f7ec0\``)
    await queryRunner.query(`ALTER TABLE \`project_group\` DROP FOREIGN KEY \`FK_f2b5c987c8e4700c911d2b4d289\``)
    await queryRunner.query(`DROP INDEX \`idx_a26c366b81deab243e1082a8ba\` ON \`user_group_permission\``)
    await queryRunner.query(`DROP INDEX \`idx_c4df58a6a7c64143d7685ab02d\` ON \`user_group_permission\``)
    await queryRunner.query(`DROP TABLE \`user_group_permission\``)
    await queryRunner.query(`DROP INDEX \`idx_ffbce6a59e3bb90fa35224f7ec\` ON \`project_group\``)
    await queryRunner.query(`DROP TABLE \`project_group\``)
    await queryRunner.query(`DROP INDEX \`idx_d3240eaf64d34439513e46cb49\` ON \`group\``)
    await queryRunner.query(`DROP TABLE \`group\``)
  }
}
