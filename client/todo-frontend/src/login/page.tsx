"use client";

import { login } from '@/services/auth';
import {useState} from "react";
import { useRouter } from 'next/navigation';
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import Link from 'next/link';



const LoginSchema = z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
})

type LoginFormData = z.infer<typeof LoginSchema>;

export default function LoginPage(){
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");

    const {register, handleSubmit, formState:{errors}} = useForm<LoginFormData>({
        resolver: zodResolver(LoginSchema),
        defaultValues: {
            username: "",
            password: "",
        }
    });

    const onSubmit = async(data: LoginFormData) => {
        setIsLoading(true);
        setError("");

        try{
            await login(data.username, data.password);
            router.push("/");
        } catch (error){{
            setError("Invalid username or password");
        }} finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-4">Login</h2>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block text-gray-700 font-bold mb-2">Username</label>
                        <input
                            id="username"
                            type="text"
                            {...register("username")}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs italic">{errors.username.message}</p>
                        )}
                    </div>
                    <div className="mb-4">
                        <label htmlFor="password" className="block text-gray-700 font-bold mb-2">Password</label>
                        <input
                            id="password"
                            type="password"
                            {...register("password")}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        {errors.password && (
                            <p className="text-red-500 text-xs italic">{errors.password.message}</p>
                        )}
                    </div>
                    {error && (
                        <p className="text-red-500 text-xs italic">{error}</p>
                    )}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    >
                        {isLoading ? "Logging in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}