require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Officer = require('../models/Officer');

// Change these values before running, or pass as CLI args
const email = process.argv[2] || "officer1@cybercell.gov.in";
const plainPassword = process.argv[3] || "ChangeThisPassword123";
const badge_id = process.argv[4] || "BADGE001";
const department = process.argv[5] || "Cyber Cell";

async function createOfficer() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const password_hash = await bcrypt.hash(plainPassword, 10);

        const officer = new Officer({
            email,
            password_hash,
            badge_id,
            department
        });

        await officer.save();
        console.log("Officer created successfully:");
        console.log({ email, badge_id, department });

    } catch (error) {
        console.error("Error creating officer:", error.message);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
}

createOfficer();