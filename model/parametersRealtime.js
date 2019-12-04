class ParametersRealtime {
    constructor(totalEnergy, totalFillWater, totalRinseWater, usageEfficiency, waterFillCount) {
        this.totalEnergy = totalEnergy;
        this.totalFillWater = totalFillWater;
        this.totalRinseWater = totalRinseWater;
        this.usageEfficiency = usageEfficiency;
        this.waterFillCount = waterFillCount;
    }
}
module.exports = ParametersRealtime;