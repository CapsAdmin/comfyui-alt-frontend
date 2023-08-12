import * as React from "react"
import { DragDropContext, Draggable, Droppable, OnDragEndResponder } from "react-beautiful-dnd"

import ListItemAvatar from "@material-ui/core/ListItemAvatar"
import ListItemText from "@material-ui/core/ListItemText"
import makeStyles from "@material-ui/core/styles/makeStyles"
import InboxIcon from "@material-ui/icons/Inbox"
import Avatar from "@mui/core/Avatar"
import ListItem from "@mui/core/ListItem"

export type Item = {
    id: string
    primary: string
    secondary: string
}

export type DraggableListProps = {
    items: Item[]
    onDragEnd: OnDragEndResponder
}

export const DraggableList = React.memo(({ items, onDragEnd }: DraggableListProps) => {
    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="droppable-list">
                {(provided) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}>
                        {items.map((item, index) => (
                            <DraggableListItem item={item} index={index} key={item.id} />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </DragDropContext>
    )
})

const useStyles = makeStyles({
    draggingListItem: {
        background: "rgb(235,235,235)",
    },
})

export type DraggableListItemProps = {
    item: Item
    index: number
}

export const DraggableListItem = ({ item, index }: DraggableListItemProps) => {
    const classes = useStyles()
    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided, snapshot) => (
                <ListItem
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={snapshot.isDragging ? classes.draggingListItem : ""}
                >
                    <ListItemAvatar>
                        <Avatar>
                            <InboxIcon />
                        </Avatar>
                    </ListItemAvatar>
                    <ListItemText primary={item.primary} secondary={item.secondary} />
                </ListItem>
            )}
        </Draggable>
    )
}

export default DraggableListItem
