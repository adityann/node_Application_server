module.exports = {
    "insert": {
        "machineKpi": 'INSERT INTO machine_kpi(id, value,value_us, machine_id, kpi, date) VALUES (uuid(),?,?,?,?,?);',
        "parametersHygiene": 'INSERT INTO parameters_hygiene(id,avg_pre_wash_temperature_celsius,avg_pre_wash_temperature_fahrenheit,avg_wash_temperature_celsius,avg_wash_temperature_fahrenheit,avg_rinse_temperature_celsius,avg_rinse_temperature_fahrenheit,avg_detergent_concentration,epoc_time,site_time,machine_id,wash_cycle) VALUES (uuid(),?,?,?,?,?,?,?,?,?,?,?);',
        "setAlert": "INSERT INTO alerts(id,machine_id,alert_id,alert,issue_type,priority,set_counter,time_set) VALUES(?,?,?,?,?,?,?,?)"
    },
    "select": {

        "getAggregatedRinseWater": "select sum(value) as rinse_water from machine_kpi where machine_id = ? and kpi in (? , ?) and date =? ;",

        "getLasInserted_plexusData": "SELECT TIME_STAMP AS last_time_stamp,divojet_water,drain_trigger,electricity_meter,fill_trigger,fill_water,machine_trigger,pre_wash_temperature,pre_wash_status,rinse_temperature,rinse_trigger,rinse_water,wash_temperature,wash_trigger,c3m_conductivity_bu,c3m_conductivity_bu_flag,rinse_temperature_status,wash_temperature_status,avg_rinse_water_flow_rate,avg_rinse_water_flow_rate_status  FROM intellidish.plexus_data WHERE machine_id=? order by time_stamp desc limit 1",

        "getTrigger_by_machineID": "SELECT value,kpi FROM intellidish.machine_kpi WHERE machine_id= ? and date=? ALLOW FILTERING;",

        "getPre_wash_status_id": "select id from intellidish.plexus_data where machine_id = ? and time_stamp = ? allow filtering",

        "getMachine_by_MachineId_Trigger": "SELECT * FROM intellidish.machine_trigger_events WHERE machine_id= ? and Trigger= ? ALLOW FILTERING",

        "byID_Name": "SELECT machines.machine_id,machines.machine_name,machines.machine_type,sites.time_zone from machines INNER JOIN sites ON machines.site_id = sites.site_id where machines.site_id in (?)",

        "getParametersRealTimeByMacId": "select site_time, epoc_time, c3m_conductivity_bu, enerygy_consumption, fill_water, pre_wash_tempreture, rinse_tempreture, rinse_water, usage_efficiency, wash_tempreture, water_change from parameters_realtime where machine_id=? and site_time>=? and site_time<=? allow filtering;",

        "getParametersRealTimeByMacId_F": "select site_time, epoc_time, c3m_conductivity_bu, enerygy_consumption, fill_water_g as fill_water, pre_wash_tempreture_f as pre_wash_tempreture, rinse_tempreture_f as rinse_tempreture, rinse_water_g as rinse_water, usage_efficiency, wash_tempreture_f as wash_tempreture, water_change_g as water_change from parameters_realtime where machine_id=? and site_time>=? and site_time<=? allow filtering;",

        "getMachineKpiMacId": "SELECT date , kpi ,value FROM intellidish.machine_kpi WHERE machine_id=? and date>=? and date<=? ALLOW FILTERING;",

        "getMachineKpiMacIdForUS": "SELECT date , kpi , value_us as value FROM intellidish.machine_kpi WHERE machine_id=? and date>=? and date<=? ALLOW FILTERING;",

        "getParameterHygieneKpiMacId_C": "SELECT site_time ,epoc_time, avg_detergent_concentration ,avg_pre_wash_temperature_celsius as avg_pre_wash_temperature, avg_rinse_temperature_celsius as avg_rinse_temperature, avg_wash_temperature_celsius as avg_wash_temperature FROM intellidish.parameters_hygiene WHERE machine_id=? and site_time>=? and site_time<=? ALLOW FILTERING;",

        "getParameterHygieneKpiMacId_F": "SELECT site_time ,epoc_time, avg_detergent_concentration ,avg_pre_wash_temperature_fahrenheit as avg_pre_wash_temperature, avg_rinse_temperature_fahrenheit as avg_rinse_temperature, avg_wash_temperature_fahrenheit as avg_wash_temperature FROM intellidish.parameters_hygiene WHERE machine_id=? and site_time>=? and site_time<=? ALLOW FILTERING;",

        "lookUPCassandraQuery": "SELECT value,id  FROM intellidish.machine_kpi WHERE machine_id=? and kpi=? and date=? ALLOW FILTERING;",

        "getMachine_kpi": "SELECT value,kpi FROM intellidish.machine_kpi WHERE machine_id=? and date=? and kpi in (? , ?)  ALLOW FILTERING;",

        "getMachine_kpi_avg": "SELECT value,kpi FROM intellidish.machine_kpi WHERE machine_id=? and date=? and kpi in (? , ?,?)  ALLOW FILTERING;",

        "getTimeFromCassandraQuery": "SELECT value,kpi FROM intellidish.machine_kpi WHERE machine_id=? and kpi in (? , ?)  ALLOW FILTERING;",

        "getDispenserFeederStatus": "select feeder_status,max(time), machine_id from intellidish.snap_shot_data where machine_id=? allow filtering;",

        "getIdFromParametersRealtime": "select id,site_time FROM intellidish.parameters_realtime Where machine_id=? and epoc_time=? allow filtering",

        "getAlertsHistory": "select alert_id, alert, clear_method, issue_type, priority, time_clear, time_set from alerts where machine_id = ? and time_set >= ? and time_set <= ? allow filtering",
        
        "getAlertCount": "SELECT max(alert_id) as count FROM alerts;"
    },
    "update": {

        "alarmThreshold_accAvgRinseWaterflowRate": "update plexus_data set pre_wash_status = ?,rinse_temperature_status = ?, wash_temperature_status = ?,c3m_conductivity_bu_flag=?, avg_rinse_water_flow_rate=?, avg_rinse_water_flow_rate_status=? where machine_id =? and time_stamp= ? and id=",

        "parametersRealtimeByMIdEpoc": 'update parameters_realtime set enerygy_consumption=?, fill_water=?, fill_water_g=?, rinse_water=?, rinse_water_g=? ,usage_efficiency=?,water_change=? WHERE machine_id=? and site_time=? and id=',

        "clearAlert": "UPDATE alerts SET time_clear = ?, clear_method = ?, clear_counter = ? WHERE alert_id = ? AND machine_id = ? AND id="
    }
}