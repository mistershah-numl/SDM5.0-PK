import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/lib/mongodb";
import User from "@/lib/models/User";
import Company from "@/lib/models/Company";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    await connect();
    const {
      name,
      email,
      password,
      companyName,
      industry,
      size,
      region,
    } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let companyId = null;

    // Create company if provided
    if (companyName) {
      const company = new Company({
        name: companyName,
        industry: industry || "Other",
        size: size || "micro",
        region: region || "Other",
        contactEmail: email,
      });
      const savedCompany = await company.save();
      companyId = savedCompany._id;
    }

    // Create user
    const user = new User({
      name,
      email,
      passwordHash: hashedPassword,
      role: companyId ? "company" : "user",
      companyId: companyId || undefined,
    });

    const savedUser = await user.save();

    // Create auth token
    const token = Buffer.from(
      JSON.stringify({
        userId: savedUser._id.toString(),
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        companyId: companyId?.toString(),
        iat: Date.now(),
      })
    ).toString("base64");

    const response = NextResponse.json(
      {
        user: {
          id: savedUser._id.toString(),
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role,
          companyId: companyId?.toString(),
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}
