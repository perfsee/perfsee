import { MigrationInterface, QueryRunner } from 'typeorm'

export class migrations1680511449981 implements MigrationInterface {
  name = 'migrations1680511449981'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`package\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`project_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`description\` varchar(255) NULL, \`keywords\` json NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_4adc0be7de8b179acda92d3a94\` (\`iid\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`package_bundle\` (\`id\` int NOT NULL AUTO_INCREMENT, \`package_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`version\` varchar(255) NOT NULL, \`hash\` varchar(40) NOT NULL, \`branch\` varchar(255) NOT NULL, \`issuer\` varchar(100) NOT NULL, \`build_key\` varchar(255) NOT NULL, \`status\` int NOT NULL DEFAULT '0', \`failed_reason\` text NULL, \`report_key\` varchar(255) NULL, \`benchmark_key\` varchar(255) NULL, \`upload_size\` int NOT NULL DEFAULT '0', \`size\` json NULL, \`duration\` int NOT NULL DEFAULT '0', \`app_version\` varchar(255) NULL DEFAULT 'unknown', \`baseline_id\` int NULL, \`is_baseline\` tinyint NOT NULL DEFAULT 0, \`has_side_effects\` tinyint NOT NULL DEFAULT 0, \`has_js_module\` tinyint NOT NULL DEFAULT 0, \`has_js_next\` tinyint NOT NULL DEFAULT 0, \`is_module_type\` tinyint NOT NULL DEFAULT 0, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_eead2a6b2a756bba896ad9cddf\` (\`package_id\`), INDEX \`idx_fb3369d24fa06e6846ce50a0de\` (\`version\`), INDEX \`idx_235d70451adc900fefa999cdbf\` (\`branch\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`package_name\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`last_uploaded_at\` timestamp NOT NULL, INDEX \`idx_b89e4cb9f6d171ced391fd368f\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`package\` ADD CONSTRAINT \`FK_13f617024a05bead47bbd551d30\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`package_bundle\` ADD CONSTRAINT \`FK_eead2a6b2a756bba896ad9cddf6\` FOREIGN KEY (\`package_id\`) REFERENCES \`package\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`package_name\` ADD CONSTRAINT \`FK_b89e4cb9f6d171ced391fd368f4\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`package_name\` DROP FOREIGN KEY \`FK_b89e4cb9f6d171ced391fd368f4\``)
    await queryRunner.query(`ALTER TABLE \`package_bundle\` DROP FOREIGN KEY \`FK_eead2a6b2a756bba896ad9cddf6\``)
    await queryRunner.query(`ALTER TABLE \`package\` DROP FOREIGN KEY \`FK_13f617024a05bead47bbd551d30\``)
    await queryRunner.query(`DROP INDEX \`idx_b89e4cb9f6d171ced391fd368f\` ON \`package_name\``)
    await queryRunner.query(`DROP TABLE \`package_name\``)
    await queryRunner.query(`DROP INDEX \`idx_235d70451adc900fefa999cdbf\` ON \`package_bundle\``)
    await queryRunner.query(`DROP INDEX \`idx_fb3369d24fa06e6846ce50a0de\` ON \`package_bundle\``)
    await queryRunner.query(`DROP INDEX \`idx_eead2a6b2a756bba896ad9cddf\` ON \`package_bundle\``)
    await queryRunner.query(`DROP TABLE \`package_bundle\``)
    await queryRunner.query(`DROP INDEX \`idx_4adc0be7de8b179acda92d3a94\` ON \`package\``)
    await queryRunner.query(`DROP TABLE \`package\``)
  }
}
