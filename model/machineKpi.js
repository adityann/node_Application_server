class MachineKpi {



    constructor(WashTime, Rinsetime, UsageEffiency, WashCycles, FillWater, FillCount, RinseWater, EnergyConsumption) {
        this.WashTime = WashTime;
        this.Rinsetime = Rinsetime;
        this.UsageEffiency = UsageEffiency;
        this.WashCycles = WashCycles;
        this.FillWater = FillWater;
        this.FillCount = FillCount;
        this.RinseWater = RinseWater;
        this.EnergyConsumption = EnergyConsumption;
    }


    get kpi() {
        let kpiObject = {};
        if (this.WashTime) kpiObject.wash_time;
        this.Rinsetime = Rinsetime;
        this.UsageEffiency = UsageEffiency;
        this.WashCycles = WashCycles;
        this.FillWater = FillWater;
        this.FillCount = FillCount;
        this.RinseWater = RinseWater;
        this.EnergyConsumption = EnergyConsumption;
        return kpiObject
    }
}


module.exports = MachineKpi;
