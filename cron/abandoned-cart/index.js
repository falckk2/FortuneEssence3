const url = process.env.APP_URL + '/api/cron/send-abandoned-cart-reminders';
const secret = process.env.CRON_SECRET;

if (!process.env.APP_URL || !secret) {
  console.error('Missing APP_URL or CRON_SECRET');
  process.exit(1);
}

fetch(url, { headers: { Authorization: `Bearer ${secret}` } })
  .then(res => res.json())
  .then(data => {
    console.log(JSON.stringify(data));
    process.exit(data.success ? 0 : 1);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
