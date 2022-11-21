import { MigrationInterface, QueryRunner } from 'typeorm'

export class projectUsage1668670929409 implements MigrationInterface {
  name = 'projectUsage1668670929409'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE \`usage_pack\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`name\` varchar(255) NOT NULL,
                \`desc\` varchar(255) NOT NULL,
                \`is_public\` tinyint NOT NULL DEFAULT 0,
                \`is_default\` tinyint NOT NULL DEFAULT 0,
                \`job_count_monthly\` int NOT NULL,
                \`job_duration_monthly\` int NOT NULL,
                \`storage\` int NOT NULL,
                \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    await queryRunner.query(`
            CREATE TABLE \`project_job_usage\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`project_id\` int NOT NULL,
                \`year\` int NOT NULL,
                \`month\` int NOT NULL,
                \`job_count\` int NOT NULL DEFAULT '0',
                \`job_duration\` decimal(10, 2) NOT NULL DEFAULT '0.00',
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`idx_da16e6d19467189502a62a0d99\` (\`project_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    await queryRunner.query(`
            CREATE TABLE \`project_storage_usage\` (
                \`id\` int NOT NULL AUTO_INCREMENT,
                \`project_id\` int NOT NULL,
                \`used\` decimal(10, 2) NOT NULL DEFAULT '0.00',
                \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                INDEX \`idx_44711059df507f55fb11a5d68e\` (\`project_id\`),
                UNIQUE INDEX \`uniq_rel_44711059df507f55fb11a5d68e\` (\`project_id\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE = InnoDB
        `)
    await queryRunner.query(`
            ALTER TABLE \`artifact\`
            ADD \`upload_size\` int NOT NULL DEFAULT '0'
        `)
    await queryRunner.query(`
            ALTER TABLE \`project\`
            ADD \`usage_pack_id\` int NULL
        `)
    await queryRunner.query(`
            ALTER TABLE \`snapshot_report\`
            ADD \`upload_size\` int NOT NULL DEFAULT '0'
        `)
    await queryRunner.query(`
            ALTER TABLE \`project\`
            ADD CONSTRAINT \`FK_89f29f98d1c234d1db6f47b1bb2\` FOREIGN KEY (\`usage_pack_id\`) REFERENCES \`usage_pack\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE \`project_job_usage\`
            ADD CONSTRAINT \`FK_da16e6d19467189502a62a0d993\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `)
    await queryRunner.query(`
            ALTER TABLE \`project_storage_usage\`
            ADD CONSTRAINT \`FK_44711059df507f55fb11a5d68e3\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
        `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE \`project_storage_usage\` DROP FOREIGN KEY \`FK_44711059df507f55fb11a5d68e3\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`project_job_usage\` DROP FOREIGN KEY \`FK_da16e6d19467189502a62a0d993\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`project\` DROP FOREIGN KEY \`FK_89f29f98d1c234d1db6f47b1bb2\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`snapshot_report\` DROP COLUMN \`upload_size\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`project\` DROP COLUMN \`usage_pack_id\`
        `)
    await queryRunner.query(`
            ALTER TABLE \`artifact\` DROP COLUMN \`upload_size\`
        `)
    await queryRunner.query(`
            DROP INDEX \`uniq_rel_44711059df507f55fb11a5d68e\` ON \`project_storage_usage\`
        `)
    await queryRunner.query(`
            DROP INDEX \`idx_44711059df507f55fb11a5d68e\` ON \`project_storage_usage\`
        `)
    await queryRunner.query(`
            DROP TABLE \`project_storage_usage\`
        `)
    await queryRunner.query(`
            DROP INDEX \`idx_da16e6d19467189502a62a0d99\` ON \`project_job_usage\`
        `)
    await queryRunner.query(`
            DROP TABLE \`project_job_usage\`
        `)
    await queryRunner.query(`
            DROP TABLE \`usage_pack\`
        `)
  }
}
