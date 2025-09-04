// import { Request, Response } from 'express';
// import bcrypt from 'bcryptjs';
// import jwt from 'jsonwebtoken';
// import { PrismaClient } from '@prisma/client';
// import { loginSchema, registerSchema } from '../types/auth';
// import { AuthRequest } from '../middleware/auth';

// const prisma = new PrismaClient();

// export class AuthController {
//   async login(req: Request, res: Response) {
//     try {
//       const { email, password } = loginSchema.parse(req.body);

//       const user = await prisma.user.findUnique({
//         where: { email },
//         include: {
//           userRoles: {
//             include: {
//               role: {
//                 include: {
//                   rolePermissions: {
//                     include: {
//                       permission: true
//                     }
//                   }
//                 }
//               }
//             }
//           }
//         }
//       });

//       if (!user || user.status !== 'ACTIVE') {
//         return res.status(401).json({ error: 'Invalid credentials' });
//       }

//       const isValidPassword = await bcrypt.compare(password, user.password);
//       if (!isValidPassword) {
//         return res.status(401).json({ error: 'Invalid credentials' });
//       }

//       // Update last login
//       await prisma.user.update({
//         where: { id: user.id },
//         data: { lastLoginAt: new Date() }
//       });

//       // Generate tokens
//       const accessToken = jwt.sign(
//   { userId: user.id, email: user.email },
//   process.env.JWT_SECRET as string,
//   { expiresIn: process.env.JWT_ACCESS_EXPIRY as string }
// );

// const refreshToken = jwt.sign(
//   { userId: user.id },
//   process.env.JWT_REFRESH_SECRET as string,
//   { expiresIn: process.env.JWT_REFRESH_EXPIRY as string }
// );


//       // Extract user data
//       const roles = user.userRoles.map(ur => ur.role.name);
//       const permissions = user.userRoles.flatMap(ur => 
//         ur.role.rolePermissions.map(rp => rp.permission.name)
//       );

//       res.json({
//         user: {
//           id: user.id,
//           email: user.email,
//           name: user.name,
//           roles,
//           permissions
//         },
//         accessToken,
//         refreshToken
//       });
//     } catch (error) {
//       console.error('Login error:', error);
//       res.status(400).json({ error: 'Invalid request data' });
//     }
//   }

//   async register(req: Request, res: Response) {
//     try {
//       const { name, email, password, roleId } = registerSchema.parse(req.body);

//       // Check if user already exists
//       const existingUser = await prisma.user.findUnique({ where: { email } });
//       if (existingUser) {
//         return res.status(400).json({ error: 'User already exists' });
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 12);

//       // Create user with role
//       const user = await prisma.$transaction(async (tx) => {
//         const newUser = await tx.user.create({
//           data: {
//             name,
//             email,
//             password: hashedPassword
//           }
//         });

//         await tx.userRole.create({
//           data: {
//             userId: newUser.id,
//             roleId
//           }
//         });

//         return newUser;
//       });

//       res.status(201).json({
//         id: user.id,
//         name: user.name,
//         email: user.email
//       });
//     } catch (error) {
//       console.error('Register error:', error);
//       res.status(400).json({ error: 'Invalid request data' });
//     }
//   }

//   async refresh(req: Request, res: Response) {
//     try {
//       const { refreshToken } = req.body;
      
//       if (!refreshToken) {
//         return res.status(401).json({ error: 'Refresh token required' });
//       }

//       const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as string;
      
//       const user = await prisma.user.findUnique({
//         where: { id: payload.userId },
//         select: { id: true, email: true, status: true }
//       });

//       if (!user || user.status !== 'ACTIVE') {
//         return res.status(401).json({ error: 'Invalid refresh token' });
//       }

//       const accessToken = jwt.sign(
//         { userId: user.id, email: user.email },
//         process.env.JWT_SECRET!,
//         { expiresIn: process.env.JWT_ACCESS_EXPIRY }
//       );

//       res.json({ accessToken });
//     } catch (error) {
//       console.error('Refresh error:', error);
//       res.status(401).json({ error: 'Invalid refresh token' });
//     }
//   }

//   async me(req: AuthRequest, res: Response) {
//     res.json(req.user);
//   }

//   async logout(req: AuthRequest, res: Response) {
//     // In a production system, you'd invalidate the refresh token here
//     res.json({ message: 'Logged out successfully' });
//   }

//   async getUsers(req: AuthRequest, res: Response) {
//     try {
//       // Check if user has permission (CFO or GM only)
//       if (!req.user?.roles.includes('CFO') && !req.user?.roles.includes('General Manager')) {
//         return res.status(403).json({ error: 'Insufficient permissions' });
//       }

//       const { page = 1, limit = 10, search } = req.query;
//       const skip = (Number(page) - 1) * Number(limit);

//       const where: any = {};
//       if (search) {
//         where.OR = [
//           { name: { contains: search as string, mode: 'insensitive' } },
//           { email: { contains: search as string, mode: 'insensitive' } }
//         ];
//       }

//       const [users, total] = await Promise.all([
//         prisma.user.findMany({
//           where,
//           skip,
//           take: Number(limit),
//           select: {
//             id: true,
//             name: true,
//             email: true,
//             status: true,
//             lastLoginAt: true,
//             createdAt: true,
//             userRoles: {
//               include: {
//                 role: {
//                   select: { name: true }
//                 }
//               }
//             }
//           },
//           orderBy: { createdAt: 'desc' }
//         }),
//         prisma.user.count({ where })
//       ]);

//       const usersWithRoles = users.map(user => ({
//         ...user,
//         roles: user.userRoles.map(ur => ur.role.name),
//         userRoles: undefined
//       }));

//       res.json({
//         users: usersWithRoles,
//         pagination: {
//           page: Number(page),
//           limit: Number(limit),
//           total,
//           pages: Math.ceil(total / Number(limit))
//         }
//       });
//     } catch (error) {
//       console.error('Get users error:', error);
//       res.status(500).json({ error: 'Failed to fetch users' });
//     }
//   }

//   async createUser(req: AuthRequest, res: Response) {
//     try {
//       // Check if user has permission (CFO or GM only)
//       if (!req.user?.roles.includes('CFO') && !req.user?.roles.includes('General Manager')) {
//         return res.status(403).json({ error: 'Insufficient permissions' });
//       }

//       const { name, email, password, roleId } = req.body;

//       // Check if user already exists
//       const existingUser = await prisma.user.findUnique({ where: { email } });
//       if (existingUser) {
//         return res.status(400).json({ error: 'User already exists' });
//       }

//       // Hash password
//       const hashedPassword = await bcrypt.hash(password, 12);

//       // Create user with role
//       const user = await prisma.$transaction(async (tx) => {
//         const newUser = await tx.user.create({
//           data: {
//             name,
//             email,
//             password: hashedPassword
//           }
//         });

//         await tx.userRole.create({
//           data: {
//             userId: newUser.id,
//             roleId
//           }
//         });

//         return newUser;
//       });

//       res.status(201).json({
//         id: user.id,
//         name: user.name,
//         email: user.email,
//         status: user.status
//       });
//     } catch (error) {
//       console.error('Create user error:', error);
//       res.status(400).json({ error: 'Failed to create user' });
//     }
//   }

//   async updateUserStatus(req: AuthRequest, res: Response) {
//     try {
//       // Check if user has permission (CFO or GM only)
//       if (!req.user?.roles.includes('CFO') && !req.user?.roles.includes('General Manager')) {
//         return res.status(403).json({ error: 'Insufficient permissions' });
//       }

//       const { id } = req.params;
//       const { status } = req.body;

//       // Prevent users from deactivating themselves
//       if (id === req.user.id) {
//         return res.status(400).json({ error: 'Cannot change your own status' });
//       }

//       const user = await prisma.user.update({
//         where: { id },
//         data: { status },
//         select: {
//           id: true,
//           name: true,
//           email: true,
//           status: true
//         }
//       });

//       res.json(user);
//     } catch (error) {
//       console.error('Update user status error:', error);
//       res.status(400).json({ error: 'Failed to update user status' });
//     }
//   }

//   async getRoles(req: AuthRequest, res: Response) {
//     try {
//       // Check if user has permission (CFO or GM only)
//       if (!req.user?.roles.includes('CFO') && !req.user?.roles.includes('General Manager')) {
//         return res.status(403).json({ error: 'Insufficient permissions' });
//       }

//       const roles = await prisma.role.findMany({
//         select: {
//           id: true,
//           name: true,
//           description: true
//         },
//         orderBy: { name: 'asc' }
//       });

//       res.json({ roles });
//     } catch (error) {
//       console.error('Get roles error:', error);
//       res.status(500).json({ error: 'Failed to fetch roles' });
//     }
//   }
// }


import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { loginSchema, registerSchema } from '../types/auth';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Utility: generate JWT token safely
function generateToken(
  payload: object,
  secret: string,
  expiresIn: string | number
): string {
  return jwt.sign(payload, secret, { expiresIn });
}

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { email, password } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          userRoles: {
            include: {
              role: {
                include: {
                  rolePermissions: {
                    include: {
                      permission: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      });

      // Generate tokens
      const accessToken = generateToken(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        process.env.JWT_ACCESS_EXPIRY as string
      );

      const refreshToken = generateToken(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET as string,
        process.env.JWT_REFRESH_EXPIRY as string
      );

      // Extract user roles & permissions
      const roles = user.userRoles.map((ur) => ur.role.name);
      const permissions = user.userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.name)
      );

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles,
          permissions,
        },
        accessToken,
        refreshToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  }

  async register(req: Request, res: Response) {
    try {
      const { name, email, password, roleId } = registerSchema.parse(req.body);

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { name, email, password: hashedPassword },
        });

        await tx.userRole.create({
          data: { userId: newUser.id, roleId },
        });

        return newUser;
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    } catch (error) {
      console.error('Register error:', error);
      res.status(400).json({ error: 'Invalid request data' });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(401).json({ error: 'Refresh token required' });
      }

      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET as string
      ) as { userId: string };

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, status: true },
      });

      if (!user || user.status !== 'ACTIVE') {
        return res.status(401).json({ error: 'Invalid refresh token' });
      }

      // Rotate tokens (best practice)
      const newAccessToken = generateToken(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        process.env.JWT_ACCESS_EXPIRY as string
      );

      const newRefreshToken = generateToken(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET as string,
        process.env.JWT_REFRESH_EXPIRY as string
      );

      res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
    } catch (error) {
      console.error('Refresh error:', error);
      res.status(401).json({ error: 'Invalid refresh token' });
    }
  }

  async me(req: AuthRequest, res: Response) {
    res.json(req.user);
  }

  async logout(req: AuthRequest, res: Response) {
    // In production, you'd invalidate refresh tokens here (e.g. store a blacklist in Redis)
    res.json({ message: 'Logged out successfully' });
  }

  async getUsers(req: AuthRequest, res: Response) {
    try {
      if (
        !req.user?.roles.includes('CFO') &&
        !req.user?.roles.includes('General Manager')
      ) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { page = 1, limit = 10, search } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: Number(limit),
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
            lastLoginAt: true,
            createdAt: true,
            userRoles: {
              include: {
                role: { select: { name: true } },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ]);

      const usersWithRoles = users.map((user) => ({
        ...user,
        roles: user.userRoles.map((ur) => ur.role.name),
        userRoles: undefined,
      }));

      res.json({
        users: usersWithRoles,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error('Get users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      if (
        !req.user?.roles.includes('CFO') &&
        !req.user?.roles.includes('General Manager')
      ) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { name, email, password, roleId } = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { name, email, password: hashedPassword },
        });

        await tx.userRole.create({
          data: { userId: newUser.id, roleId },
        });

        return newUser;
      });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status,
      });
    } catch (error) {
      console.error('Create user error:', error);
      res.status(400).json({ error: 'Failed to create user' });
    }
  }

  async updateUserStatus(req: AuthRequest, res: Response) {
    try {
      if (
        !req.user?.roles.includes('CFO') &&
        !req.user?.roles.includes('General Manager')
      ) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const { id } = req.params;
      const { status } = req.body;

      if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own status' });
      }

      const user = await prisma.user.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, email: true, status: true },
      });

      res.json(user);
    } catch (error) {
      console.error('Update user status error:', error);
      res.status(400).json({ error: 'Failed to update user status' });
    }
  }

  async getRoles(req: AuthRequest, res: Response) {
    try {
      if (
        !req.user?.roles.includes('CFO') &&
        !req.user?.roles.includes('General Manager')
      ) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const roles = await prisma.role.findMany({
        select: { id: true, name: true, description: true },
        orderBy: { name: 'asc' },
      });

      res.json({ roles });
    } catch (error) {
      console.error('Get roles error:', error);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }
}
