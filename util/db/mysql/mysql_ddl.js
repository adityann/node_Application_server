module.exports = {
    "insert": {
        "alertFilter": "INSERT INTO alert_filter_settings (wash_cycle_count_set, wash_cycle_count_clear, last_modified_by, alert, machine_id) VALUES (?,?,?,?,?);"
        // "machineTriggerEvent": "Insert into machine_trigger_events(ID,Machine_ID,Trigger,Status,TotalTime,Time_Log) values (? , ? , ? ,? , ?, toUnixTimestamp(now()));"

    },
    "select": {
        "getRole": "SELECT * from user_roles where role = ? ",

        "getSiteName": "SELECT DISTINCT(sites.name),sites.site_id from machines INNER JOIN sites ON machines.site_id = sites.site_id where customer_id = ? and region = ? and country = ? and city =? ",

        "getCityName": "SELECT Distinct(city) from machines INNER JOIN sites ON machines.site_id = sites.site_id where customer_id = ? and region = ? and country = ?;",

        "getCountryName": "SELECT Distinct(country) from machines INNER JOIN sites ON machines.site_id = sites.site_id where customer_id = ? and region = ?;",

        "getRegionName": "SELECT Distinct(region) from machines INNER JOIN sites ON machines.site_id = sites.site_id where customer_id = ?;",

        "getOrganisationDetails": "select region,country,city,site_id  from sites where name = ?;",

        "getOrganisationName": "select customer_id,customer_name from customers order by customer_name;",

        "getMachineEnergyPulseRate": "select device_id, pulse_rate from energy_meter_pulse;",

        "getRackCountDetails": "select machine_id,rack_time from machines;",

        "getMachineTankVolumeCapacity": "select machine_system_id,(tank1_volume+tank2_volume+tank3_volume+tank4_volume+tank5_volume) as tank_volume from water_use;",

        "getalarm_threshold": "SELECT * FROM alarm_threshold;",

        "byID_Name": "SELECT machines.machine_id,machines.machine_name,machines.machine_type,sites.time_zone from machines INNER JOIN sites ON machines.site_id = sites.site_id where machines.site_id in (?)",

        "machineByID": "select machines.machine_system_id,device_type,machine_type from machines ,intellidish where machines.machine_system_id = intellidish.device_id and machines.site_id in (?)",

        "getAllAssets": "select machines.machine_system_id,device_type,machine_type from machines ,intellidish where machines.machine_system_id = intellidish.device_id order by machine_id asc;",

        "getUTCTime": "select machine_system_id,time_zone from machines inner join  sites on machines.site_id = sites.site_id;",

        "getMachineWaterInfo": "select device_id, liter_per_pulse,nominal_machine_rinse_flow_rate,meter_type " +
            " from water_meter_pulse INNER JOIN water_use " +
            " ON water_meter_pulse.device_id = water_use.machine_system_id",

        "getInstalledSensor": "select device_id,sensor_name,status from installed_sensor;",

        "getLocaleMetaData": "select locale,language_code,date_format,date_format,time_format,temperature,currency,number_format,mass_unit,length_unit,area_unit,volume_unit,volume_unit,electrical_energy_unit  from units_measures where licd = ?;",

        "getDispenserModules": "select dispenser_module_name from dispenser_module where device_id=? ORDER by dispenser_module_sequence;",

        "getGlobalAlertFilter": `SELECT global.alert,global.issue_type,global.priority,global.alert_name,machine.wash_cycle_count_clear,
            machine.wash_cycle_count_set from alert_filter_settings_global as global INNER JOIN alert_filter_settings
            as machine on global.alert = machine.alert where machine.machine_id = ?;`,

        "getThresoldValues": 'SELECT * from alarm_threshold where machine_system_id = ?;',
        
        "getMachineNominalRinse": "select machine_system_id,nominal_machine_rinse_flow_rate from water_use",

        "getAlertSettingGlobal": "SELECT alert,wash_cycle_count_clear,wash_cycle_count_set FROM alert_filter_settings_global;",
        "getAlertSetting": "SELECT alert,wash_cycle_count_clear,wash_cycle_count_set FROM alert_filter_settings WHERE machine_id = ?;"
    },
    "update": {
        "alertFilterGlobal": "UPDATE alert_filter_settings_global SET wash_cycle_count_set = ?, wash_cycle_count_clear = ?, last_modified_by = ? WHERE alert = ?;",
        "alertFilter": "UPDATE alert_filter_settings SET wash_cycle_count_set = ?, wash_cycle_count_clear = ?, last_modified_by = ? WHERE alert = ? AND machine_id = ?;",

        "updateAlaramThreshold": "UPDATE alarm_threshold set default_min_value =?,default_max_value=?,adjusted_min_value=?,adjusted_max_value=?,adjusted_value_used=? WHERE machine_system_id= ? AND alarm_type =? "
        // "machine_trigger_events": "UPDATE intellidish.machine_trigger_events SET TotalTime = ? where ID= ?"
    }
}