import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../lib/utils"
import { Button } from "./button"

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    selected,
    onSelect,
    ...props
}) {
    const [currentMonth, setCurrentMonth] = React.useState(
        selected instanceof Date ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
    )

    const daysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
    }

    const firstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ]

    const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

    const goToPreviousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const selectDate = (day) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
        onSelect?.(newDate)
    }

    const isSelected = (day) => {
        if (!selected || !(selected instanceof Date)) return false
        return (
            selected.getDate() === day &&
            selected.getMonth() === currentMonth.getMonth() &&
            selected.getFullYear() === currentMonth.getFullYear()
        )
    }

    const isToday = (day) => {
        const today = new Date()
        return (
            today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear()
        )
    }

    const days = daysInMonth(currentMonth)
    const firstDay = firstDayOfMonth(currentMonth)
    const calendarDays = []

    // Add empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        calendarDays.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= days; day++) {
        calendarDays.push(day)
    }

    return (
        <div className={cn("p-3", className)} {...props}>
            <div className="flex justify-between items-center mb-4">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goToPreviousMonth}
                >
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="font-semibold">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </div>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={goToNextMonth}
                >
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 mb-1">
                {dayNames.map((day) => (
                    <div
                        key={day}
                        className="text-center text-xs font-medium text-muted-foreground"
                    >
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                    <div key={index}>
                        {day ? (
                            <Button
                                variant={isSelected(day) ? "default" : "ghost"}
                                size="sm"
                                className={cn(
                                    "h-8 w-8 p-0 font-normal",
                                    isToday(day) && !isSelected(day) && "border border-primary",
                                    isSelected(day) && "bg-primary text-primary-foreground"
                                )}
                                onClick={() => selectDate(day)}
                            >
                                {day}
                            </Button>
                        ) : (
                            <div className="h-8 w-8" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

Calendar.displayName = "Calendar"

export { Calendar }

