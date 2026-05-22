
export function formatTimeWithAMPM(timeString) {
  if (!timeString) return "";

  // Remove microseconds if present
  const cleanTimeStr = timeString.split(".")[0];
  const [hours, minutes] = cleanTimeStr.split(":");

  let hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? "PM" : "AM";

  hour = hour % 12;
  hour = hour ? hour : 12;

  return `${hour}:${minutes} ${ampm}`;
}

export function transformDSRData(apiData, month) {
  if (!apiData || apiData.length === 0) return [];

  const transformed = [];
  const [year, monthNum] = month.split('-');

  apiData.forEach((partner) => {
    const dayKeys = Object.keys(partner).filter(key => key.startsWith("day-"));

    dayKeys.forEach((dayKey) => {
      const dayNumber = dayKey.split("-")[1];
      const customersArray = partner[dayKey];

      customersArray.forEach((customerObj) => {
        const [customerName] = Object.keys(customerObj);
        const delivery = customerObj[customerName];
        const logId = customerObj.log_id;

        transformed.push({
          log_id: logId,
          customer_id: customerObj.customer_id,
          delivery_partner_id: customerObj.delivery_partner_id,
          partner_name: partner.partner_name,
          area: partner.area,
          day: dayNumber,
          customer: customerName,
          status: delivery.delivery_status,
          liters: delivery.liters || "",
          delivery_time: delivery.delivery_time ? formatTimeWithAMPM(delivery.delivery_time) : "",
          delivery_time_raw: delivery.delivery_time ? delivery.delivery_time.split('.')[0].substring(0, 5) : "",
          delivery_date: `${year}-${monthNum}-${String(dayNumber).padStart(2, "0")}`,
        });
      });
    });
  });

  return transformed;
}


// // Get unique partners from data
// function getUniquePartners(data) {
//   if (!data || data.length === 0) return [];
//   const partners = data.map((item) => item.partner_name);
//   return [...new Set(partners)]; // Remove duplicates
// }
// // Get unique areas from data
// function getUniqueAreas(data) {
//   if (!data || data.length === 0) return [];
//   const areas = data.map((item) => item.area);
//   return [...new Set(areas)]; // Remove duplicates
// }
// // Get unique status from data
// function getUniqueStatus(data) {
//   if (!data || data.length === 0) return [];
//   const status = data.map((item) => item.status);
//   return [...new Set(status)]; // Remove duplicates
// }


export function getUniqueValues(data, field) {
  if (!data || data.length === 0) return [];
  const values = data.map((item) => item[field]);
  return [...new Set(values)];
}