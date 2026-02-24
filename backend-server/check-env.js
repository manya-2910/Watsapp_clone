const dotenv = require('dotenv');
const result = dotenv.config();
if (result.error) {
    console.error(result.error);
}
console.log('DATABASE_URL:', process.env.DATABASE_URL);
