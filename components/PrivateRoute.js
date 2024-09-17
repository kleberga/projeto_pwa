'use client'

import { useRouter } from "next/router";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";

const PrivateRoute = ({children}) => {
    const { user } = useAuth();
    const router = useRouter();
    const publicRoutes = ['/register'];

    useEffect(() => {
        if(!user && !publicRoutes.includes(router.pathname)){
            router.push('/')
        }
    },[user, router.pathname])

    return user || publicRoutes.includes(router.pathname) ? children : null;
}

export default PrivateRoute;