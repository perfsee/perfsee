import { MigrationInterface, QueryRunner } from 'typeorm'

export class cascade1662709646753 implements MigrationInterface {
  name = 'cascade1662709646753'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`access_token\` DROP FOREIGN KEY \`FK_4bd9bc00776919370526766eb43\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP FOREIGN KEY \`FK_e1e62448be830d8da33cb2c6102\``)
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP FOREIGN KEY \`FK_5f5da14712db92faa1ee41ed737\``)
    await queryRunner.query(`ALTER TABLE \`artifact_name\` DROP FOREIGN KEY \`FK_f9f0894817c6d628c1e3df51dd4\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_957331498173532c9cd9464265c\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_eda2a40bcd6d147b28a0839222e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_competitor\` DROP FOREIGN KEY \`FK_cfc0e58dd919d0f6b360a475b40\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_d08b36dd741538cbf2b7451fb0e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_de9de6d3596e8b10a54cd0d6080\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_0058255655f7027135025c65202\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_e5d1753d9cb6a1243fac087cd5e\``)
    await queryRunner.query(`ALTER TABLE \`page\` DROP FOREIGN KEY \`FK_8018adf3d04a1873595c021c886\``)
    await queryRunner.query(`ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_01f5c521c33e78c00ff78fd798d\``)
    await queryRunner.query(`ALTER TABLE \`environment\` DROP FOREIGN KEY \`FK_2b33a6c1d5c1276d3b502daf4de\``)
    await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_63751a9ebee56db104825bfbb47\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_787259d4365648b21c28eb20aec\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d2df6dff88d77a3df1d3e3ae606\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d3a913b2625d011ce5912bcedf8\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_e54660c3d494f0c80423667aa3a\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_f56fe80334e2bbfbfa297373db6\``)
    await queryRunner.query(`ALTER TABLE \`snapshot\` DROP FOREIGN KEY \`FK_459b31c42604b89a49be0c6fffc\``)
    await queryRunner.query(`ALTER TABLE \`source_issue\` DROP FOREIGN KEY \`FK_a7df2f155b406433c1091ca7a8d\``)
    await queryRunner.query(`ALTER TABLE \`timer\` DROP FOREIGN KEY \`FK_06b72da2964551e83add8d9abc8\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_2305dfa7330dd7f8e211f4f35d9\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_e18d264897f25a0ddb0bce75cb1\``)
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_23737fe5d3ccef3214da0d3d90f\``)
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_3eb5014f29193c627413e62746d\``)
    await queryRunner.query(
      `ALTER TABLE \`access_token\` ADD CONSTRAINT \`FK_4bd9bc00776919370526766eb43\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`app_version\` ADD CONSTRAINT \`FK_e1e62448be830d8da33cb2c6102\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD CONSTRAINT \`FK_5f5da14712db92faa1ee41ed737\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_name\` ADD CONSTRAINT \`FK_f9f0894817c6d628c1e3df51dd4\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_eda2a40bcd6d147b28a0839222e\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_957331498173532c9cd9464265c\` FOREIGN KEY (\`artifact_id\`) REFERENCES \`artifact\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_competitor\` ADD CONSTRAINT \`FK_cfc0e58dd919d0f6b360a475b40\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_de9de6d3596e8b10a54cd0d6080\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_d08b36dd741538cbf2b7451fb0e\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_e5d1753d9cb6a1243fac087cd5e\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_0058255655f7027135025c65202\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page\` ADD CONSTRAINT \`FK_8018adf3d04a1873595c021c886\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`profile\` ADD CONSTRAINT \`FK_01f5c521c33e78c00ff78fd798d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD CONSTRAINT \`FK_2b33a6c1d5c1276d3b502daf4de\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_63751a9ebee56db104825bfbb47\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d2df6dff88d77a3df1d3e3ae606\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_787259d4365648b21c28eb20aec\` FOREIGN KEY (\`snapshot_id\`) REFERENCES \`snapshot\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_e54660c3d494f0c80423667aa3a\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_f56fe80334e2bbfbfa297373db6\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d3a913b2625d011ce5912bcedf8\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot\` ADD CONSTRAINT \`FK_459b31c42604b89a49be0c6fffc\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`source_issue\` ADD CONSTRAINT \`FK_a7df2f155b406433c1091ca7a8d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`timer\` ADD CONSTRAINT \`FK_06b72da2964551e83add8d9abc8\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_2305dfa7330dd7f8e211f4f35d9\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_e18d264897f25a0ddb0bce75cb1\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_23737fe5d3ccef3214da0d3d90f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_3eb5014f29193c627413e62746d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`internal_id\` ADD CONSTRAINT \`FK_1b64943f3c41dfa4e71410eb6b8\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`job\` ADD CONSTRAINT \`FK_e100e9f656d36fa3f74d01f04b5\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_3eb5014f29193c627413e62746d\``)
    await queryRunner.query(`ALTER TABLE \`user_starred_project\` DROP FOREIGN KEY \`FK_23737fe5d3ccef3214da0d3d90f\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_e18d264897f25a0ddb0bce75cb1\``)
    await queryRunner.query(`ALTER TABLE \`user_permission\` DROP FOREIGN KEY \`FK_2305dfa7330dd7f8e211f4f35d9\``)
    await queryRunner.query(`ALTER TABLE \`timer\` DROP FOREIGN KEY \`FK_06b72da2964551e83add8d9abc8\``)
    await queryRunner.query(`ALTER TABLE \`source_issue\` DROP FOREIGN KEY \`FK_a7df2f155b406433c1091ca7a8d\``)
    await queryRunner.query(`ALTER TABLE \`snapshot\` DROP FOREIGN KEY \`FK_459b31c42604b89a49be0c6fffc\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d3a913b2625d011ce5912bcedf8\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_f56fe80334e2bbfbfa297373db6\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_e54660c3d494f0c80423667aa3a\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_787259d4365648b21c28eb20aec\``)
    await queryRunner.query(`ALTER TABLE \`snapshot_report\` DROP FOREIGN KEY \`FK_d2df6dff88d77a3df1d3e3ae606\``)
    await queryRunner.query(`ALTER TABLE \`setting\` DROP FOREIGN KEY \`FK_63751a9ebee56db104825bfbb47\``)
    await queryRunner.query(`ALTER TABLE \`environment\` DROP FOREIGN KEY \`FK_2b33a6c1d5c1276d3b502daf4de\``)
    await queryRunner.query(`ALTER TABLE \`profile\` DROP FOREIGN KEY \`FK_01f5c521c33e78c00ff78fd798d\``)
    await queryRunner.query(`ALTER TABLE \`page\` DROP FOREIGN KEY \`FK_8018adf3d04a1873595c021c886\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_0058255655f7027135025c65202\``)
    await queryRunner.query(`ALTER TABLE \`page_with_profile\` DROP FOREIGN KEY \`FK_e5d1753d9cb6a1243fac087cd5e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_d08b36dd741538cbf2b7451fb0e\``)
    await queryRunner.query(`ALTER TABLE \`page_with_env\` DROP FOREIGN KEY \`FK_de9de6d3596e8b10a54cd0d6080\``)
    await queryRunner.query(`ALTER TABLE \`page_with_competitor\` DROP FOREIGN KEY \`FK_cfc0e58dd919d0f6b360a475b40\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_957331498173532c9cd9464265c\``)
    await queryRunner.query(`ALTER TABLE \`artifact_entrypoint\` DROP FOREIGN KEY \`FK_eda2a40bcd6d147b28a0839222e\``)
    await queryRunner.query(`ALTER TABLE \`artifact_name\` DROP FOREIGN KEY \`FK_f9f0894817c6d628c1e3df51dd4\``)
    await queryRunner.query(`ALTER TABLE \`artifact\` DROP FOREIGN KEY \`FK_5f5da14712db92faa1ee41ed737\``)
    await queryRunner.query(`ALTER TABLE \`app_version\` DROP FOREIGN KEY \`FK_e1e62448be830d8da33cb2c6102\``)
    await queryRunner.query(`ALTER TABLE \`access_token\` DROP FOREIGN KEY \`FK_4bd9bc00776919370526766eb43\``)
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_3eb5014f29193c627413e62746d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_starred_project\` ADD CONSTRAINT \`FK_23737fe5d3ccef3214da0d3d90f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_e18d264897f25a0ddb0bce75cb1\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`user_permission\` ADD CONSTRAINT \`FK_2305dfa7330dd7f8e211f4f35d9\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`timer\` ADD CONSTRAINT \`FK_06b72da2964551e83add8d9abc8\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`source_issue\` ADD CONSTRAINT \`FK_a7df2f155b406433c1091ca7a8d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot\` ADD CONSTRAINT \`FK_459b31c42604b89a49be0c6fffc\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_f56fe80334e2bbfbfa297373db6\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_e54660c3d494f0c80423667aa3a\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d3a913b2625d011ce5912bcedf8\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_d2df6dff88d77a3df1d3e3ae606\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`snapshot_report\` ADD CONSTRAINT \`FK_787259d4365648b21c28eb20aec\` FOREIGN KEY (\`snapshot_id\`) REFERENCES \`snapshot\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`setting\` ADD CONSTRAINT \`FK_63751a9ebee56db104825bfbb47\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`environment\` ADD CONSTRAINT \`FK_2b33a6c1d5c1276d3b502daf4de\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`profile\` ADD CONSTRAINT \`FK_01f5c521c33e78c00ff78fd798d\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page\` ADD CONSTRAINT \`FK_8018adf3d04a1873595c021c886\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_e5d1753d9cb6a1243fac087cd5e\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_profile\` ADD CONSTRAINT \`FK_0058255655f7027135025c65202\` FOREIGN KEY (\`profile_id\`) REFERENCES \`profile\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_de9de6d3596e8b10a54cd0d6080\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_env\` ADD CONSTRAINT \`FK_d08b36dd741538cbf2b7451fb0e\` FOREIGN KEY (\`env_id\`) REFERENCES \`environment\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`page_with_competitor\` ADD CONSTRAINT \`FK_cfc0e58dd919d0f6b360a475b40\` FOREIGN KEY (\`page_id\`) REFERENCES \`page\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_eda2a40bcd6d147b28a0839222e\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_entrypoint\` ADD CONSTRAINT \`FK_957331498173532c9cd9464265c\` FOREIGN KEY (\`artifact_id\`) REFERENCES \`artifact\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact_name\` ADD CONSTRAINT \`FK_f9f0894817c6d628c1e3df51dd4\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`artifact\` ADD CONSTRAINT \`FK_5f5da14712db92faa1ee41ed737\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`app_version\` ADD CONSTRAINT \`FK_e1e62448be830d8da33cb2c6102\` FOREIGN KEY (\`project_id\`) REFERENCES \`project\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(
      `ALTER TABLE \`access_token\` ADD CONSTRAINT \`FK_4bd9bc00776919370526766eb43\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`,
    )
    await queryRunner.query(`ALTER TABLE \`internal_id\` DROP FOREIGN KEY \`FK_1b64943f3c41dfa4e71410eb6b8\``)
    await queryRunner.query(`ALTER TABLE \`job\` DROP FOREIGN KEY \`FK_e100e9f656d36fa3f74d01f04b5\``)
  }
}
