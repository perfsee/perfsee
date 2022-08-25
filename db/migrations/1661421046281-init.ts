import { MigrationInterface, QueryRunner } from 'typeorm'

export class init1661421046281 implements MigrationInterface {
  name = 'init1661421046281'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`access_token\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`last_used_at\` timestamp NOT NULL, INDEX \`idx_4bd9bc00776919370526766eb4\` (\`user_id\`), INDEX \`idx_70ba8f6af34bc924fc9e12adb8\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`application_setting\` (\`id\` int NOT NULL AUTO_INCREMENT, \`registration_token\` varchar(255) NOT NULL, \`job_zones\` json NULL, \`default_job_zone\` varchar(50) NOT NULL, \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`app_version\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`project_id\` int NOT NULL, \`hash\` varchar(40) NOT NULL, \`branch\` varchar(255) NULL, \`version\` varchar(255) NULL, \`snapshot_id\` int NULL, \`artifact_id\` int NULL, \`exempted\` tinyint NOT NULL DEFAULT '0', \`exempted_reason\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_e1e62448be830d8da33cb2c610\` (\`project_id\`), INDEX \`idx_499e7cfbf322ba55318e769534\` (\`hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`artifact\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`iid\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`hash\` varchar(40) NOT NULL, \`branch\` varchar(255) NOT NULL, \`issuer\` varchar(100) NOT NULL, \`build_key\` varchar(255) NOT NULL, \`status\` int NOT NULL DEFAULT '0', \`failed_reason\` text NULL, \`report_key\` varchar(255) NULL, \`content_key\` varchar(255) NULL, \`score\` int NULL, \`duration\` int NOT NULL DEFAULT '0', \`app_version\` varchar(255) NULL DEFAULT 'unknown', \`toolkit\` varchar(255) NOT NULL DEFAULT 'unknown', \`baseline_id\` int NULL, \`is_baseline\` tinyint NOT NULL DEFAULT 0, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), INDEX \`idx_5f5da14712db92faa1ee41ed73\` (\`project_id\`), INDEX \`idx_ddcde94bfc0addc4241c9e65fb\` (\`branch\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`artifact_name\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`last_uploaded_at\` timestamp NOT NULL, INDEX \`idx_f9f0894817c6d628c1e3df51dd\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`artifact_entrypoint\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`artifact_id\` int NOT NULL, \`branch\` varchar(255) NOT NULL, \`hash\` varchar(40) NOT NULL, \`artifact_name\` varchar(255) NOT NULL, \`entrypoint\` varchar(255) NOT NULL, \`size\` json NULL, \`initial_size\` json NULL, \`baseline_size\` json NULL, \`baseline_initial_size\` json NULL, \`score\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_eda2a40bcd6d147b28a0839222\` (\`project_id\`), INDEX \`idx_957331498173532c9cd9464265\` (\`artifact_id\`), INDEX \`idx_b2e4f986d9d95fa6655aa6fa97\` (\`branch\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`github_check_runs_association\` (\`id\` int NOT NULL AUTO_INCREMENT, \`check_id\` varchar(255) NOT NULL, \`github_check_run_id\` bigint NOT NULL, INDEX \`idx_6b87c2305dc269fb6086d39289\` (\`check_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`github_pull_requests_association\` (\`id\` int NOT NULL AUTO_INCREMENT, \`github_pull_request_id\` bigint NOT NULL, \`github_pull_request_comment_id\` bigint NULL, INDEX \`idx_3c44938514dbc81bd35b1797db\` (\`github_pull_request_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`job\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`project_id\` int NOT NULL, \`job_type\` varchar(50) NOT NULL, \`entity_id\` int NOT NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`started_at\` timestamp NULL, \`ended_at\` timestamp NULL, \`duration\` int NULL, \`status\` tinyint NOT NULL DEFAULT '0', \`zone\` varchar(50) NOT NULL, \`runner_id\` int NULL, INDEX \`idx_e100e9f656d36fa3f74d01f04b\` (\`project_id\`), INDEX \`idx_d9fa8592dba62162a7e8636c73\` (\`entity_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`internal_id\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`usage\` tinyint NOT NULL, \`last_value\` int NOT NULL, INDEX \`idx_1b64943f3c41dfa4e71410eb6b\` (\`project_id\`), UNIQUE INDEX \`idx_b05d252f86aba91e7c6f27acb8\` (\`project_id\`, \`usage\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`page_with_competitor\` (\`id\` int NOT NULL AUTO_INCREMENT, \`page_id\` int NOT NULL, \`competitor_id\` int NOT NULL, INDEX \`idx_cfc0e58dd919d0f6b360a475b4\` (\`page_id\`), INDEX \`idx_b0f452aef10b0019e00eaa927e\` (\`competitor_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`page_with_env\` (\`id\` int NOT NULL AUTO_INCREMENT, \`page_id\` int NOT NULL, \`env_id\` int NOT NULL, INDEX \`idx_de9de6d3596e8b10a54cd0d608\` (\`page_id\`), INDEX \`idx_d08b36dd741538cbf2b7451fb0\` (\`env_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`project\` (\`id\` int NOT NULL AUTO_INCREMENT, \`slug\` varchar(100) NOT NULL, \`namespace\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`host\` varchar(255) NOT NULL, \`artifact_baseline_branch\` varchar(255) NOT NULL DEFAULT 'master', \`is_public\` tinyint NOT NULL DEFAULT 0, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`idx_6fce32ddd71197807027be6ad3\` (\`slug\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`page_with_profile\` (\`id\` int NOT NULL AUTO_INCREMENT, \`page_id\` int NOT NULL, \`profile_id\` int NOT NULL, INDEX \`idx_e5d1753d9cb6a1243fac087cd5\` (\`page_id\`), INDEX \`idx_0058255655f7027135025c6520\` (\`profile_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`page\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`url\` text NULL, \`project_id\` int NOT NULL, \`is_competitor\` tinyint NOT NULL DEFAULT 0, \`is_temp\` tinyint NOT NULL DEFAULT 0, \`is_e2e\` tinyint NOT NULL DEFAULT 0, \`e2e_script\` text NULL, \`disable\` tinyint NOT NULL DEFAULT 0, INDEX \`idx_8018adf3d04a1873595c021c88\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`profile\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`name\` varchar(255) NOT NULL DEFAULT 'Desktop', \`device\` varchar(255) NOT NULL DEFAULT 'no', \`band_width\` varchar(255) NOT NULL DEFAULT 'no', \`project_id\` int NOT NULL, \`disable\` tinyint NOT NULL DEFAULT 0, INDEX \`idx_01f5c521c33e78c00ff78fd798\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`environment\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`name\` varchar(255) NOT NULL, \`zone\` varchar(50) NOT NULL, \`cookies\` json NULL, \`headers\` json NULL, \`project_id\` int NOT NULL, \`is_competitor\` tinyint NOT NULL DEFAULT 0, \`need_reminder\` tinyint NOT NULL DEFAULT 0, \`disable\` tinyint NOT NULL DEFAULT 0, INDEX \`idx_2b33a6c1d5c1276d3b502daf4d\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`runner_script\` (\`id\` int NOT NULL AUTO_INCREMENT, \`version\` varchar(255) NOT NULL, \`description\` text NULL, \`sha256\` varchar(255) NOT NULL, \`job_type\` varchar(255) NOT NULL, \`storage_key\` varchar(255) NOT NULL, \`size\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`enable\` tinyint NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`snapshot_report\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`project_id\` int NOT NULL, \`snapshot_id\` int NOT NULL, \`page_id\` int NOT NULL, \`profile_id\` int NOT NULL, \`env_id\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`status\` tinyint NOT NULL DEFAULT '3', \`lighthouse_storage_key\` varchar(255) NULL, \`screencast_storage_key\` varchar(255) NULL, \`js_coverage_storage_key\` varchar(255) NULL, \`trace_events_storage_key\` varchar(255) NULL, \`flame_chart_storage_key\` varchar(255) NULL, \`source_coverage_storage_key\` varchar(255) NULL, \`metrics\` json NULL, \`failed_reason\` varchar(255) NULL, \`performance_score\` int NULL, \`host\` varchar(255) NULL, INDEX \`idx_d2df6dff88d77a3df1d3e3ae60\` (\`project_id\`), INDEX \`idx_787259d4365648b21c28eb20ae\` (\`snapshot_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`snapshot\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`iid\` int NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`started_at\` timestamp NULL, \`status\` int NOT NULL DEFAULT '3', \`failed_reason\` text NULL, \`issuer\` varchar(255) NULL COMMENT 'snapshot creator', \`hash\` varchar(40) NULL COMMENT 'git commit hash', \`title\` varchar(255) NULL COMMENT 'snapshot title', \`trigger\` int NOT NULL DEFAULT '0', INDEX \`idx_459b31c42604b89a49be0c6fff\` (\`project_id\`), INDEX \`idx_a45f864714e32770c8510199bf\` (\`hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`setting\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`bundle_message_source\` tinyint NOT NULL COMMENT 'what kind of source of bundle message would be sent' DEFAULT '1', \`bundle_message_filter\` tinyint NOT NULL COMMENT 'what kind of bundle message would be sent' DEFAULT '1', \`bundle_message_branches\` text NULL COMMENT 'branches where message should be sent if', \`lab_message_source\` tinyint NOT NULL COMMENT 'what kind of lab message would be sent' DEFAULT '1', \`message_target_type\` tinyint NOT NULL COMMENT 'what kind of chat will receive message' DEFAULT '1', \`message_target\` text NULL COMMENT 'who will receive message if target type is specified', INDEX \`idx_63751a9ebee56db104825bfbb4\` (\`project_id\`), UNIQUE INDEX \`uniq_rel_63751a9ebee56db104825bfbb4\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`source_issue\` (\`id\` int NOT NULL AUTO_INCREMENT, \`iid\` int NOT NULL, \`project_id\` int NOT NULL, \`hash\` varchar(255) NOT NULL, \`snapshot_report_id\` int NOT NULL, \`code\` varchar(255) NOT NULL COMMENT 'issue code', \`frame_key\` varchar(255) NOT NULL COMMENT 'formatted in functionName:FilePath:line:col', \`info\` json NOT NULL COMMENT 'extra information to description given issue', \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_a7df2f155b406433c1091ca7a8\` (\`project_id\`), INDEX \`idx_776b7d546ab57328a80a60d6d5\` (\`hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_connected_account\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`provider\` varchar(255) NOT NULL, \`extern_username\` varchar(255) NOT NULL, \`access_token\` varchar(255) NOT NULL, INDEX \`idx_e956657dfdd875f5bc44c412c1\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_permission\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`project_id\` int NOT NULL, \`permission\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), INDEX \`idx_2305dfa7330dd7f8e211f4f35d\` (\`user_id\`), INDEX \`idx_e18d264897f25a0ddb0bce75cb\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user_starred_project\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` int NOT NULL, \`project_id\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`timer\` (\`id\` int NOT NULL AUTO_INCREMENT, \`project_id\` int NOT NULL, \`schedule\` tinyint NOT NULL DEFAULT '1', \`hour\` tinyint NULL, \`time_of_day\` tinyint NULL, \`next_trigger_time\` timestamp NOT NULL, \`page_ids\` text NULL, \`profile_ids\` text NULL, \`env_ids\` text NULL, \`monitor_type\` tinyint NOT NULL DEFAULT '1', INDEX \`idx_06b72da2964551e83add8d9abc\` (\`project_id\`), UNIQUE INDEX \`uniq_rel_06b72da2964551e83add8d9abc\` (\`project_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`runner\` (\`id\` int NOT NULL AUTO_INCREMENT, \`uuid\` varchar(255) NOT NULL, \`registration_token\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`name\` varchar(255) NULL, \`job_type\` varchar(255) NOT NULL, \`contacted_at\` timestamp NOT NULL, \`active\` tinyint NOT NULL, \`version\` varchar(255) NOT NULL, \`node_version\` varchar(255) NOT NULL, \`platform\` varchar(255) NOT NULL, \`arch\` varchar(255) NOT NULL, \`zone\` varchar(255) NOT NULL, \`extra\` json NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), UNIQUE INDEX \`idx_285cc63572b2eafabbc0fa292b\` (\`uuid\`), INDEX \`idx_e376069173d13e69bdc12bc4c8\` (\`token\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`username\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NULL, \`first_name\` varchar(255) NULL, \`last_name\` varchar(255) NULL, \`avatar_url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`is_app\` tinyint NOT NULL DEFAULT 0, \`is_admin\` tinyint NOT NULL DEFAULT 0, \`is_fulfilled\` tinyint NOT NULL DEFAULT 1, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    )
    await queryRunner.query(
      `ALTER TABLE \`access_token\` ADD CONSTRAINT \`FK_4bd9bc00776919370526766eb43\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`app_version\` ADD CONSTRAINT \`FK_e1e62448be830d8da33cb2c6102\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD CONSTRAINT \`FK_5f5da14712db92faa1ee41ed737\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_name\` ADD CONSTRAINT \`FK_f9f0894817c6d628c1e3df51dd4\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_eda2a40bcd6d147b28a0839222e\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_957331498173532c9cd9464265c\` FOREIGN KEY (\`artifact_id\`) REFERENCES \`artifact\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD CONSTRAINT \`FK_ca5fac3e39d6e93df14903d1072\` FOREIGN KEY (\`runner_id\`) REFERENCES \`runner\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_competitor\` ADD CONSTRAINT \`FK_cfc0e58dd919d0f6b360a475b40\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_competitor\` ADD CONSTRAINT \`FK_b0f452aef10b0019e00eaa927e5\` FOREIGN KEY (\`competitor_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_de9de6d3596e8b10a54cd0d6080\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_d08b36dd741538cbf2b7451fb0e\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_e5d1753d9cb6a1243fac087cd5e\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_0058255655f7027135025c65202\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page\` ADD CONSTRAINT \`FK_8018adf3d04a1873595c021c886\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`profile\` ADD CONSTRAINT \`FK_01f5c521c33e78c00ff78fd798d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD CONSTRAINT \`FK_2b33a6c1d5c1276d3b502daf4de\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d2df6dff88d77a3df1d3e3ae606\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_787259d4365648b21c28eb20aec\` FOREIGN KEY (\`snapshot_id\`) REFERENCES \`snapshot\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_e54660c3d494f0c80423667aa3a\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_f56fe80334e2bbfbfa297373db6\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d3a913b2625d011ce5912bcedf8\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot\` ADD CONSTRAINT \`FK_459b31c42604b89a49be0c6fffc\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_63751a9ebee56db104825bfbb47\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`source_issue\` ADD CONSTRAINT \`FK_a7df2f155b406433c1091ca7a8d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`source_issue\` ADD CONSTRAINT \`FK_4835a8bf4d0ae06e03541edfa89\` FOREIGN KEY (\`snapshot_report_id\`) REFERENCES \`snapshot_report\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_connected_account\` ADD CONSTRAINT \`FK_e956657dfdd875f5bc44c412c17\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_2305dfa7330dd7f8e211f4f35d9\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_e18d264897f25a0ddb0bce75cb1\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_23737fe5d3ccef3214da0d3d90f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_3eb5014f29193c627413e62746d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`timer\` ADD CONSTRAINT \`FK_06b72da2964551e83add8d9abc8\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`timer\` DROP FOREIGN KEY \`FK_06b72da2964551e83add8d9abc8\``)
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_3eb5014f29193c627413e62746d\``)
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_23737fe5d3ccef3214da0d3d90f\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_e18d264897f25a0ddb0bce75cb1\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_2305dfa7330dd7f8e211f4f35d9\``)
    await queryRunner.query(
      `ALTER TABLE \`user_connected_account\` DROP FOREIGN KEY \`FK_e956657dfdd875f5bc44c412c17\``,
    )
    await queryRunner.query(`ALTER TABLE \`source_issue\` DROP FOREIGN KEY \`FK_4835a8bf4d0ae06e03541edfa89\``)
    await queryRunner.query(`ALTER TABLE \`source_issue\` DROP FOREIGN KEY \`FK_a7df2f155b406433c1091ca7a8d\``)
    await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_63751a9ebee56db104825bfbb47\``)
    await queryRunner.query(`ALTER TABLE \`snapshot\` DROP FOREIGN KEY \`FK_459b31c42604b89a49be0c6fffc\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d3a913b2625d011ce5912bcedf8\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_f56fe80334e2bbfbfa297373db6\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_e54660c3d494f0c80423667aa3a\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_787259d4365648b21c28eb20aec\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d2df6dff88d77a3df1d3e3ae606\``)
    await queryRunner.query(`ALTER TABLE \`environment\` DROP FOREIGN KEY \`FK_2b33a6c1d5c1276d3b502daf4de\``)
    await queryRunner.query(`ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_01f5c521c33e78c00ff78fd798d\``)
    await queryRunner.query(`ALTER TABLE \`page\` DROP FOREIGN KEY \`FK_8018adf3d04a1873595c021c886\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_0058255655f7027135025c65202\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_e5d1753d9cb6a1243fac087cd5e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_d08b36dd741538cbf2b7451fb0e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_de9de6d3596e8b10a54cd0d6080\``)
    await queryRunner.query(`ALTER TABLE \`page_with_competitor\` DROP FOREIGN KEY \`FK_b0f452aef10b0019e00eaa927e5\``)
    await queryRunner.query(`ALTER TABLE \`page_with_competitor\` DROP FOREIGN KEY \`FK_cfc0e58dd919d0f6b360a475b40\``)
    await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_ca5fac3e39d6e93df14903d1072\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_957331498173532c9cd9464265c\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_eda2a40bcd6d147b28a0839222e\``)
    await queryRunner.query(`ALTER TABLE \`artifact_name\` DROP FOREIGN KEY \`FK_f9f0894817c6d628c1e3df51dd4\``)
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP FOREIGN KEY \`FK_5f5da14712db92faa1ee41ed737\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP FOREIGN KEY \`FK_e1e62448be830d8da33cb2c6102\``)
    await queryRunner.query(`ALTER TABLE \`access_token\` DROP FOREIGN KEY \`FK_4bd9bc00776919370526766eb43\``)
    await queryRunner.query(`DROP TABLE \`user\``)
    await queryRunner.query(`DROP INDEX \`idx_e376069173d13e69bdc12bc4c8\` ON \`runner\``)
    await queryRunner.query(`DROP INDEX \`idx_285cc63572b2eafabbc0fa292b\` ON \`runner\``)
    await queryRunner.query(`DROP TABLE \`runner\``)
    await queryRunner.query(`DROP INDEX \`uniq_rel_06b72da2964551e83add8d9abc\` ON \`timer\``)
    await queryRunner.query(`DROP INDEX \`idx_06b72da2964551e83add8d9abc\` ON \`timer\``)
    await queryRunner.query(`DROP TABLE \`timer\``)
    await queryRunner.query(`DROP TABLE \`user_starred_project\``)
    await queryRunner.query(`DROP INDEX \`idx_e18d264897f25a0ddb0bce75cb\` ON \`user_permission\``)
    await queryRunner.query(`DROP INDEX \`idx_2305dfa7330dd7f8e211f4f35d\` ON \`user_permission\``)
    await queryRunner.query(`DROP TABLE \`user_permission\``)
    await queryRunner.query(`DROP INDEX \`idx_e956657dfdd875f5bc44c412c1\` ON \`user_connected_account\``)
    await queryRunner.query(`DROP TABLE \`user_connected_account\``)
    await queryRunner.query(`DROP INDEX \`idx_776b7d546ab57328a80a60d6d5\` ON \`source_issue\``)
    await queryRunner.query(`DROP INDEX \`idx_a7df2f155b406433c1091ca7a8\` ON \`source_issue\``)
    await queryRunner.query(`DROP TABLE \`source_issue\``)
    await queryRunner.query(`DROP INDEX \`uniq_rel_63751a9ebee56db104825bfbb4\` ON \`setting\``)
    await queryRunner.query(`DROP INDEX \`idx_63751a9ebee56db104825bfbb4\` ON \`setting\``)
    await queryRunner.query(`DROP TABLE \`setting\``)
    await queryRunner.query(`DROP INDEX \`idx_a45f864714e32770c8510199bf\` ON \`snapshot\``)
    await queryRunner.query(`DROP INDEX \`idx_459b31c42604b89a49be0c6fff\` ON \`snapshot\``)
    await queryRunner.query(`DROP TABLE \`snapshot\``)
    await queryRunner.query(`DROP INDEX \`idx_787259d4365648b21c28eb20ae\` ON \`snapshot_report\``)
    await queryRunner.query(`DROP INDEX \`idx_d2df6dff88d77a3df1d3e3ae60\` ON \`snapshot_report\``)
    await queryRunner.query(`DROP TABLE \`snapshot_report\``)
    await queryRunner.query(`DROP TABLE \`runner_script\``)
    await queryRunner.query(`DROP INDEX \`idx_2b33a6c1d5c1276d3b502daf4d\` ON \`environment\``)
    await queryRunner.query(`DROP TABLE \`environment\``)
    await queryRunner.query(`DROP INDEX \`idx_01f5c521c33e78c00ff78fd798\` ON \`profile\``)
    await queryRunner.query(`DROP TABLE \`profile\``)
    await queryRunner.query(`DROP INDEX \`idx_8018adf3d04a1873595c021c88\` ON \`page\``)
    await queryRunner.query(`DROP TABLE \`page\``)
    await queryRunner.query(`DROP INDEX \`idx_0058255655f7027135025c6520\` ON \`page_with_profile\``)
    await queryRunner.query(`DROP INDEX \`idx_e5d1753d9cb6a1243fac087cd5\` ON \`page_with_profile\``)
    await queryRunner.query(`DROP TABLE \`page_with_profile\``)
    await queryRunner.query(`DROP INDEX \`idx_6fce32ddd71197807027be6ad3\` ON \`project\``)
    await queryRunner.query(`DROP TABLE \`project\``)
    await queryRunner.query(`DROP INDEX \`idx_d08b36dd741538cbf2b7451fb0\` ON \`page_with_env\``)
    await queryRunner.query(`DROP INDEX \`idx_de9de6d3596e8b10a54cd0d608\` ON \`page_with_env\``)
    await queryRunner.query(`DROP TABLE \`page_with_env\``)
    await queryRunner.query(`DROP INDEX \`idx_b0f452aef10b0019e00eaa927e\` ON \`page_with_competitor\``)
    await queryRunner.query(`DROP INDEX \`idx_cfc0e58dd919d0f6b360a475b4\` ON \`page_with_competitor\``)
    await queryRunner.query(`DROP TABLE \`page_with_competitor\``)
    await queryRunner.query(`DROP INDEX \`idx_b05d252f86aba91e7c6f27acb8\` ON \`internal_id\``)
    await queryRunner.query(`DROP INDEX \`idx_1b64943f3c41dfa4e71410eb6b\` ON \`internal_id\``)
    await queryRunner.query(`DROP TABLE \`internal_id\``)
    await queryRunner.query(`DROP INDEX \`idx_d9fa8592dba62162a7e8636c73\` ON \`job\``)
    await queryRunner.query(`DROP INDEX \`idx_e100e9f656d36fa3f74d01f04b\` ON \`job\``)
    await queryRunner.query(`DROP TABLE \`job\``)
    await queryRunner.query(`DROP INDEX \`idx_3c44938514dbc81bd35b1797db\` ON \`github_pull_requests_association\``)
    await queryRunner.query(`DROP TABLE \`github_pull_requests_association\``)
    await queryRunner.query(`DROP INDEX \`idx_6b87c2305dc269fb6086d39289\` ON \`github_check_runs_association\``)
    await queryRunner.query(`DROP TABLE \`github_check_runs_association\``)
    await queryRunner.query(`DROP INDEX \`idx_b2e4f986d9d95fa6655aa6fa97\` ON \`artifact_entrypoint\``)
    await queryRunner.query(`DROP INDEX \`idx_957331498173532c9cd9464265\` ON \`artifact_entrypoint\``)
    await queryRunner.query(`DROP INDEX \`idx_eda2a40bcd6d147b28a0839222\` ON \`artifact_entrypoint\``)
    await queryRunner.query(`DROP TABLE \`artifact_entrypoint\``)
    await queryRunner.query(`DROP INDEX \`idx_f9f0894817c6d628c1e3df51dd\` ON \`artifact_name\``)
    await queryRunner.query(`DROP TABLE \`artifact_name\``)
    await queryRunner.query(`DROP INDEX \`idx_ddcde94bfc0addc4241c9e65fb\` ON \`artifact\``)
    await queryRunner.query(`DROP INDEX \`idx_5f5da14712db92faa1ee41ed73\` ON \`artifact\``)
    await queryRunner.query(`DROP TABLE \`artifact\``)
    await queryRunner.query(`DROP INDEX \`idx_499e7cfbf322ba55318e769534\` ON \`app_version\``)
    await queryRunner.query(`DROP INDEX \`idx_e1e62448be830d8da33cb2c610\` ON \`app_version\``)
    await queryRunner.query(`DROP TABLE \`app_version\``)
    await queryRunner.query(`DROP TABLE \`application_setting\``)
    await queryRunner.query(`DROP INDEX \`idx_70ba8f6af34bc924fc9e12adb8\` ON \`access_token\``)
    await queryRunner.query(`DROP INDEX \`idx_4bd9bc00776919370526766eb4\` ON \`access_token\``)
    await queryRunner.query(`DROP TABLE \`access_token\``)
  }
}
