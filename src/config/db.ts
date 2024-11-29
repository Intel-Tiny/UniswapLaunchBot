import dotenv from 'dotenv'
dotenv.config()

import mongoose from 'mongoose'
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI)
        console.log('::DB connected: ')
    } catch (err) {
        console.error('::DB conection Error: ', err.message)
        process.exit(1)
    }
}
