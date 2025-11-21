"use client"
import { useEffect } from "react"
import { useMap } from "react-leaflet"

interface MapViewControlProps {
    center: [number, number]
    zoom: number
}

export default function MapViewControl({ center, zoom }: MapViewControlProps) {
    const map = useMap()

    useEffect(() => {
        map.flyTo(center, zoom, {
            duration: 1.5
        })
    }, [center, zoom, map])

    return null
}
