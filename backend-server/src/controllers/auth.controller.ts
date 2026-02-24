import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';

export const register = async (req: Request, res: Response) => {
    try {
        const { phone, name } = req.body;

        const existingUser = await prisma.user.findUnique({ where: { phone } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const user = await prisma.user.create({
            data: { phone, name }
        });

        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret', { expiresIn: '30d' });

        res.status(201).json({ user, accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { phone } = req.body;

        const user = await prisma.user.findUnique({ where: { phone } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Simulate OTP verification
        const accessToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId: user.id }, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret', { expiresIn: '30d' });

        res.json({ user, accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

export const refresh = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: 'Refresh token required' });

    try {
        const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret') as { userId: string };
        const accessToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });
        res.json({ accessToken });
    } catch (error) {
        res.status(403).json({ error: 'Invalid refresh token' });
    }
};
