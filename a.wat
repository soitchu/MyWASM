(module(import "env" "memory" (memory $0 1))(func $print (import "env" "print") (param i32))
  (func $input (import "env" "input") (result i32))
  (func $sleep (import "env" "sleep") (param i32))
  (func $random (import "env" "random") (result f64))
  (func $allocate_memory (import "env" "allocate_memory") (param i32) (result i32))
  (func $deallocate_memory (import "env" "deallocate_memory") (param i32) (param i32))
  (export "string_ini" (func $string_ini))
  (export "main_string_ini" (func $main_string_ini))
  (export "main_string_ini_unpooled" (func $main_string_ini_unpooled))
  (export "string_ini_assign" (func $string_ini_assign))
  (global $mem (mut i32) (i32.const 0))
  (global $tmp (mut i32) (i32.const 0))

  (func $check_in_bounds (param $arr i32) (param $index i32)
    local.get $index
    i32.const 0
    i32.lt_s
    local.get $index
    local.get $arr
    call $length
    i32.ge_s
    i32.or
    if
      unreachable
    end
  )
  
  
  (func $check_if_null (param $struct i32) (result i32)
    local.get $struct
    i32.eqz
    if
      unreachable
    end
    
    local.get $struct
    return
  )

  (func $itod (param $num i32) (result f64)
    local.get $num
    f64.convert_i32_s
    return
  )
  
  (func $dtoi (param $num f64) (result i32)
    local.get $num
    i32.trunc_f64_s
    return
  )
  
  (func $length (param $arr i32) (result i32)
    local.get $arr
    i32.const 4
    i32.sub
    i32.load
  )

  (func $length_string (param $arr i32) (result i32)
    local.get $arr
    i32.const 4
    i32.sub
    i32.load
  )
  
  (func $error (param $str_array i32)
    unreachable
  )
  
  (func $get_array_pointer (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $array_int_to_string (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $string_to_array_int (param $arr i32) (result i32)
    local.get $arr
  )
  
  (func $delete_i32_array (param $delete_i32_array0_arr i32)
    local.get $delete_i32_array0_arr
    call $get_array_pointer
    i32.const 4
    i32.sub
    i32.const 4
    local.get $delete_i32_array0_arr
    call $length
    i32.const 1
    i32.add
    i32.mul
    call $deallocate_memory
    i32.const 0
    return
  )

  (func $delete_f64_array (param $delete_f64_array0_arr i32)
    local.get $delete_f64_array0_arr
    i32.const 4
    i32.sub
    
    i32.const 8
    local.get $delete_f64_array0_arr
    call $length
    i32.mul
    i32.const 1
    i32.add
    call $deallocate_memory
    i32.const 0
    return
  )
  ;; Used by the runtime to input user data
  (func $string_ini_assign (param $array i32) (param $index i32) (param $value i32) (result i32)    
    local.get $array
    local.get $index
    i32.const 4
    i32.mul
    i32.add
    local.get $value
    i32.store

    local.get $array
    return
  )

  



  (func $print_string (param $print_string0_value i32)
    local.get $print_string0_value
    call $print
  )
  
  (func $i32_set_array_elem (param $value i32) (param $index i32) (param $arr i32) 
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    i32.store
  )

  (func $i32_set_array_elem_alt (param $value i32) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $i32_set_array_elem
  )
  
  (func $i32_get_array_elem (param $index i32) (param $arr i32) (result i32)
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    i32.load
    return
  )
  
  (func $i32_get_array_elem_alt (param $arr i32) (param $index i32) (result i32)
    local.get $index
    local.get $arr
    call $i32_get_array_elem
  )
  
  (func $i32_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  
  (func $f32_set_array_elem (param $value f32) (param $index i32) (param $arr i32) 
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    f32.store
  )

  (func $f32_set_array_elem_alt (param $value f32) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $f32_set_array_elem
  )
  
  (func $f32_get_array_elem (param $index i32) (param $arr i32) (result f32)
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 4
    i32.mul
    local.get $arr
    i32.add
    f32.load
    return
  )
  
  (func $f32_get_array_elem_alt (param $arr i32) (param $index i32) (result f32)
    local.get $index
    local.get $arr
    call $f32_get_array_elem
  )
  
  (func $f32_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 4
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  
  (func $f64_set_array_elem (param $value f64) (param $index i32) (param $arr i32) 
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 8
    i32.mul
    local.get $arr
    i32.add
    local.get $value
    f64.store
  )

  (func $f64_set_array_elem_alt (param $value f64) (param $arr i32) (param $index i32)   
    local.get $value
    local.get $index
    local.get $arr
    call $f64_set_array_elem
  )
  
  (func $f64_get_array_elem (param $index i32) (param $arr i32) (result f64)
    
    local.get $arr
    call $check_if_null
    local.get $index
    call $check_in_bounds
    
    local.get $index
    i32.const 8
    i32.mul
    local.get $arr
    i32.add
    f64.load
    return
  )
  
  (func $f64_get_array_elem_alt (param $arr i32) (param $index i32) (result f64)
    local.get $index
    local.get $arr
    call $f64_get_array_elem
  )
  
  (func $f64_new_array (param $size i32) (result i32)
   (local $index i32)
    local.get $size
    i32.const 8
    i32.mul
    i32.const 4
    i32.add
    call $allocate_memory
    i32.const 4
    i32.add
    local.set $index

    local.get $index
    i32.const 4
    i32.sub
    local.get $size
    i32.store

    local.get $index
    return
  )
  (func $allocate_struct (param $size i32) (result i32)
    (local $tmpOffset i32)
    local.get $size
    i32.const 4
    i32.add
    call $allocate_memory
    local.tee $tmpOffset
    
    local.get $size
    i32.store
    
    local.get $tmpOffset
    i32.const 4
    i32.add
  )

  (func $delete_struct (param $pointer i32)
    (local $length i32)

    local.get $pointer
    i32.const 4
    i32.sub
    i32.load
    local.set $length

    local.get $pointer
    i32.const 4
    i32.sub
    local.get $length
    i32.const 4
    i32.add
    call $deallocate_memory
    i32.const 0
    return
  )
  
  (func $i32_assign_to_struct (param $value i32) (param $struct i32) (param $index i32)
    local.get $struct
    call $check_if_null
    local.get $index
    i32.add

    local.get $value
    i32.store
  )
  
  (func $f64_assign_to_struct (param $value f64) (param $struct i32) (param $index i32)
    local.get $struct
    call $check_if_null
    local.get $index
    i32.add

    local.get $value
    f64.store
  )
  
  (func $string_ini (param $length i32) (result i32)
  (local $totalBytes i32)
  (local $tmpOffset i32)

  i32.const 4
  i32.const 4
  local.get $length
  i32.mul
  i32.add
  local.set $totalBytes

  local.get $totalBytes
  call $allocate_memory
  local.set $tmpOffset

  local.get $tmpOffset
  local.get $length
  i32.store

  local.get $tmpOffset
  i32.const 4
  i32.add
  
  return
)
  
(export "main" (func $main_main))
(data (i32.const 8) "\00\00\00\00")
(data (i32.const 12) "\04\00\00\00\74\00\00\00\72\00\00\00\75\00\00\00\65\00\00\00")
(data (i32.const 32) "\05\00\00\00\66\00\00\00\61\00\00\00\6c\00\00\00\73\00\00\00\65\00\00\00")
(data (i32.const 4) "\38\00\00\00")(data (i32.const 56) "\02\00\00\00\31\00\00\00\30\00\00\00")
(data (i32.const 4) "\44\00\00\00")

  (func $string_print (param $str i32)
   (local $current i32)
  (local $tmp i32)

    local.get $str
    local.set $current

    (loop $loop1
      local.get $current
      i32.const 0
      i32.ne
      if
        local.get $current
        call $check_if_null
        i32.const 0
        i32.add
        i32.load
        call $print
        local.get $current
        call $check_if_null
        i32.const 8
        i32.add
        i32.load
        local.set $current
        br $loop1
      end
    )
    i32.const 0
    return
  )

  (func $itos (param $a i32) (result i32)
   (local $is_neg i32)
   (local $size i32)
   (local $val i32)
   (local $result i32)
   (local $index i32)
  (local $tmp i32)

    local.get $a
    i32.const 0
    i32.lt_s
    local.set $is_neg

    i32.const 0
    local.set $size

    local.get $a
    i32.const 0
    i32.lt_s
    if
      local.get $a
      i32.const 0
      i32.const 1
      i32.sub
      i32.mul
      local.set $a
    end

    local.get $a
    local.set $val

    (loop $loop1
      local.get $val
      i32.const 0
      i32.gt_s
      if
        local.get $size
        i32.const 1
        i32.add
        local.set $size
        local.get $val
        i32.const 10
        i32.div_s
        local.set $val
        br $loop1
      end
    )

    local.get $is_neg
    if
      local.get $size
      i32.const 1
      i32.add
      local.set $size
    end

    local.get $size
    call $i32_new_array
    local.set $result

    local.get $is_neg
    if
      i32.const 45
      i32.const 0
      local.get $result
      call $i32_set_array_elem
    end

    local.get $a
    local.set $val

    i32.const 0
    local.set $index

    (loop $loop2
      local.get $val
      i32.const 0
      i32.gt_s
      if
        i32.const 48
        local.get $val
        i32.const 10
        i32.rem_s
        i32.add
        local.get $size
        local.get $index
        i32.const 1
        i32.add
        i32.sub
        local.get $result
        call $i32_set_array_elem
        local.get $index
        i32.const 1
        i32.add
        local.set $index
        local.get $val
        i32.const 10
        i32.div_s
        local.set $val
        br $loop2
      end
    )

    i32.const 16
    call $allocate_struct
    local.set $tmp
    local.get $result
    local.get $tmp
    i32.const 0
    call $i32_assign_to_struct
    local.get $size
    local.get $tmp
    i32.const 4
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 8
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 12
    call $i32_assign_to_struct
    local.get $tmp
    return
    i32.const 0
    return
  )

  (func $dtos (param $d f64) (result i32)
   (local $precision i32)
   (local $total_length i32)
   (local $is_neg i32)
   (local $int_part_string i32)
   (local $int_part i32)
   (local $int_length i32)
   (local $offset i32)
   (local $fract_part f64)
   (local $result i32)
   (local $i i32)
   (local $j i32)
   (local $digit i32)
  (local $tmp i32)

    i32.const 10
    local.set $precision

    local.get $precision
    i32.const 1
    i32.add
    local.set $total_length

    local.get $d
    f64.const 0.0
    f64.lt
    local.set $is_neg

    local.get $is_neg
    if
      local.get $total_length
      i32.const 1
      i32.add
      local.set $total_length
      local.get $d
      f64.const 0.0
      f64.const 1.0
      f64.sub
      f64.mul
      local.set $d
    end

    local.get $d
    call $dtoi
    call $itos
    local.set $int_part_string

    local.get $int_part_string
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $int_part

    local.get $int_part
    call $length
    local.set $int_length

    i32.const 0
    local.set $offset

    local.get $total_length
    local.get $int_length
    i32.add
    local.set $total_length

    local.get $d
    local.get $d
    call $dtoi
    call $itod
    f64.sub
    local.set $fract_part

    local.get $total_length
    call $i32_new_array
    local.set $result

    local.get $is_neg
    if
      i32.const 45
      local.get $offset
      local.get $result
      call $i32_set_array_elem
      local.get $offset
      i32.const 1
      i32.add
      local.set $offset
    end

    i32.const 0
    local.set $i
    (loop $loop1
      local.get $i
      local.get $int_part
      call $i32_get_array_elem
      local.get $offset
      local.get $result
      call $i32_set_array_elem
      local.get $offset
      i32.const 1
      i32.add
      local.set $offset
      local.get $i
      i32.const 1
      i32.add
      local.set $i
      local.get $i
      local.get $int_length
      i32.lt_s
      br_if $loop1
    )

    i32.const 46
    local.get $offset
    local.get $result
    call $i32_set_array_elem

    local.get $offset
    i32.const 1
    i32.add
    local.set $offset

    i32.const 0
    local.set $j
    (loop $loop2
      local.get $fract_part
      f64.const 10.0
      f64.mul
      local.set $fract_part
      local.get $fract_part
      call $dtoi
      local.set $digit
      i32.const 48
      local.get $digit
      i32.add
      local.get $offset
      local.get $result
      call $i32_set_array_elem
      local.get $fract_part
      local.get $digit
      call $itod
      f64.sub
      local.set $fract_part
      local.get $offset
      i32.const 1
      i32.add
      local.set $offset
      local.get $j
      i32.const 1
      i32.add
      local.set $j
      local.get $j
      local.get $precision
      i32.lt_s
      br_if $loop2
    )

    local.get $int_part_string
    call $delete_struct

    local.get $int_part
    call $delete_i32_array

    i32.const 16
    call $allocate_struct
    local.set $tmp
    local.get $result
    local.get $tmp
    i32.const 0
    call $i32_assign_to_struct
    local.get $total_length
    local.get $tmp
    i32.const 4
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 8
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 12
    call $i32_assign_to_struct
    local.get $tmp
    return
    i32.const 0
    return
  )

  (func $stoi (param $s i32) (result i32)
   (local $current i32)
   (local $val i32)
   (local $int_string i32)
   (local $len i32)
   (local $i i32)
  (local $tmp i32)

    local.get $s
    local.set $current

    i32.const 0
    local.set $val

    (loop $loop1
      local.get $current
      i32.const 0
      i32.ne
      if
        local.get $current
        call $check_if_null
        i32.const 0
        i32.add
        i32.load
        call $string_to_array_int
        local.set $int_string
        local.get $int_string
        call $length
        local.set $len
        i32.const 0
        local.set $i
        (loop $loop2
          local.get $val
          i32.const 10
          i32.mul
          local.get $i
          local.get $int_string
          call $i32_get_array_elem
          i32.const 48
          i32.sub
          i32.add
          local.set $val
          local.get $i
          i32.const 1
          i32.add
          local.set $i
          local.get $i
          local.get $len
          i32.lt_s
          br_if $loop2
        )
        local.get $current
        call $check_if_null
        i32.const 8
        i32.add
        i32.load
        local.set $current
        br $loop1
      end
    )

    local.get $val
    return
    i32.const 0
    return
  )

  (func $stod (param $str i32) (result f64)
   (local $int_arr i32)
   (local $is_neg i32)
   (local $found_decimal i32)
   (local $decimal_coeff f64)
   (local $d f64)
   (local $i i32)
  (local $tmp i32)

    local.get $str
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $int_arr

    i32.const 0
    local.set $is_neg

    i32.const 0
    local.set $found_decimal

    f64.const 10.0
    local.set $decimal_coeff

    f64.const 0.0
    local.set $d

    i32.const 0
    local.set $i
    (loop $loop1
      local.get $i
      local.get $int_arr
      call $i32_get_array_elem
      i32.const 45
      i32.eq
      if
        local.get $i
        i32.const 0
        i32.ne
        if
        else
          i32.const 1
          local.set $is_neg
        end
      else
        local.get $i
        local.get $int_arr
        call $i32_get_array_elem
        i32.const 48
        i32.ge_s
        local.get $i
        local.get $int_arr
        call $i32_get_array_elem
        i32.const 57
        i32.le_s
        i32.and
        if
          local.get $found_decimal
          if
            local.get $d
            local.get $i
            local.get $int_arr
            call $i32_get_array_elem
            i32.const 48
            i32.sub
            call $itod
            local.get $decimal_coeff
            f64.div
            f64.add
            local.set $d
            local.get $decimal_coeff
            f64.const 10.0
            f64.mul
            local.set $decimal_coeff
          else
            local.get $d
            f64.const 10.0
            f64.mul
            local.get $i
            local.get $int_arr
            call $i32_get_array_elem
            i32.const 48
            i32.sub
            call $itod
            f64.add
            local.set $d
          end
        else
          local.get $i
          local.get $int_arr
          call $i32_get_array_elem
          i32.const 46
          i32.eq
          if
            local.get $found_decimal
            if
              i32.const 12
              call $main_string_ini
              call $error
            else
              i32.const 1
              local.set $found_decimal
            end
          else
            i32.const 12
            call $main_string_ini
            call $error
          end
        end
      end
      local.get $i
      i32.const 1
      i32.add
      local.set $i
      local.get $i
      local.get $int_arr
      call $length
      i32.lt_s
      br_if $loop1
    )

    local.get $is_neg
    if
      local.get $d
      f64.const 0.0
      f64.const 1.0
      f64.sub
      f64.mul
      local.set $d
    end

    local.get $d
    return
    f64.const 0
    return
  )

  (func $string_append (param $string_1 i32) (param $string_2 i32)
   (local $current i32)
   (local $last_string i32)
  (local $tmp i32)

    local.get $string_2
    call $main_string_copy
    local.set $string_2

    local.get $string_1
    local.set $current

    i32.const 0
    local.set $last_string

    (loop $loop1
      local.get $current
      i32.const 0
      i32.eq
      i32.const -1
      i32.mul
      i32.const 1
      i32.add
      if
        local.get $current
        local.set $last_string
        local.get $current
        call $check_if_null
        i32.const 8
        i32.add
        i32.load
        local.set $current
        br $loop1
      end
    )

    local.get $string_2
    local.get $last_string
    call $check_if_null
    i32.const 8
    call $i32_assign_to_struct
    i32.const 0
    return
  )

  (func $string_compare (param $str1 i32) (param $str2 i32) (result i32)
   (local $currentString1 i32)
   (local $currentString2 i32)
   (local $str1Array i32)
   (local $str2Array i32)
   (local $str1Counter i32)
   (local $str2Counter i32)
   (local $value1 i32)
   (local $value2 i32)
  (local $tmp i32)

    local.get $str1
    local.set $currentString1

    local.get $str2
    local.set $currentString2

    local.get $str1
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $str1Array

    local.get $str2
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $str2Array

    i32.const 0
    local.set $str1Counter

    i32.const 0
    local.set $str2Counter

    (loop $loop1
      local.get $str1Array
      i32.const 0
      i32.ne
      local.get $str2Array
      i32.const 0
      i32.ne
      i32.and
      if
        local.get $str1Counter
        local.get $str1Array
        call $i32_get_array_elem
        local.set $value1
        local.get $str2Counter
        local.get $str2Array
        call $i32_get_array_elem
        local.set $value2
        local.get $value1
        local.get $value2
        i32.ne
        if
          i32.const 0
          return
        end
        local.get $str1Counter
        i32.const 1
        i32.add
        local.set $str1Counter
        local.get $str2Counter
        i32.const 1
        i32.add
        local.set $str2Counter
        local.get $str1Counter
        local.get $str1Array
        call $length
        i32.ge_s
        if
          local.get $currentString1
          call $check_if_null
          i32.const 8
          i32.add
          i32.load
          local.set $currentString1
          local.get $currentString1
          i32.const 0
          i32.ne
          if
            local.get $currentString1
            call $check_if_null
            i32.const 0
            i32.add
            i32.load
            local.set $str1Array
            i32.const 0
            local.set $str1Counter
          else
            i32.const 0
            local.set $str1Array
          end
        end
        local.get $str2Counter
        local.get $str2Array
        call $length
        i32.ge_s
        if
          local.get $currentString2
          call $check_if_null
          i32.const 8
          i32.add
          i32.load
          local.set $currentString2
          local.get $currentString2
          i32.const 0
          i32.ne
          if
            local.get $currentString2
            call $check_if_null
            i32.const 0
            i32.add
            i32.load
            local.set $str2Array
            i32.const 0
            local.set $str2Counter
          else
            i32.const 0
            local.set $str2Array
          end
        end
        br $loop1
      end
    )

    local.get $currentString1
    i32.const 0
    i32.eq
    local.get $currentString2
    i32.const 0
    i32.eq
    i32.and
    if
      i32.const 1
      return
    end

    i32.const 0
    return
    i32.const 0
    return
  )

  (func $get (param $str i32) (param $index i32) (result i32)
   (local $val i32)
   (local $result i32)
  (local $tmp i32)

    local.get $str
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $val

    i32.const 1
    call $i32_new_array
    local.set $result

    local.get $index
    local.get $val
    call $i32_get_array_elem
    i32.const 0
    local.get $result
    call $i32_set_array_elem

    local.get $result
    call $main_string_ini_unpooled
    return
    i32.const 0
    return
  )

  (func $main_string_ini (param $str i32) (result i32)
  (local $tmp i32)

    i32.const 16
    call $allocate_struct
    local.set $tmp
    local.get $str
    call $string_to_array_int
    local.get $tmp
    i32.const 0
    call $i32_assign_to_struct
    local.get $str
    call $length_string
    local.get $tmp
    i32.const 4
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 8
    call $i32_assign_to_struct
    i32.const 1
    local.get $tmp
    i32.const 12
    call $i32_assign_to_struct
    local.get $tmp
    return
    i32.const 0
    return
  )

  (func $main_string_ini_unpooled (param $str i32) (result i32)
  (local $tmp i32)

    i32.const 16
    call $allocate_struct
    local.set $tmp
    local.get $str
    call $string_to_array_int
    local.get $tmp
    i32.const 0
    call $i32_assign_to_struct
    local.get $str
    call $length_string
    local.get $tmp
    i32.const 4
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 8
    call $i32_assign_to_struct
    i32.const 0
    local.get $tmp
    i32.const 12
    call $i32_assign_to_struct
    local.get $tmp
    return
    i32.const 0
    return
  )

  (func $main_string_copy (param $str i32) (result i32)
   (local $value i32)
   (local $len i32)
   (local $i i32)
  (local $tmp i32)

    local.get $str
    i32.const 0
    i32.eq
    if
      i32.const 0
      return
    end

    local.get $str
    call $check_if_null
    i32.const 0
    i32.add
    i32.load
    local.set $value

    local.get $str
    call $check_if_null
    i32.const 12
    i32.add
    i32.load
    i32.const -1
    i32.mul
    i32.const 1
    i32.add
    if
      local.get $value
      call $length
      local.set $len
      local.get $len
      call $i32_new_array
      local.set $value
      i32.const 0
      local.set $i
      (loop $loop1
        local.get $str
        call $check_if_null
        i32.const 0
        i32.add
        i32.load
        local.get $i
        call $i32_get_array_elem_alt
        local.get $i
        local.get $value
        call $i32_set_array_elem
        local.get $i
        i32.const 1
        i32.add
        local.set $i
        local.get $i
        local.get $len
        i32.lt_s
        br_if $loop1
      )
    end

    i32.const 16
    call $allocate_struct
    local.set $tmp
    local.get $value
    local.get $tmp
    i32.const 0
    call $i32_assign_to_struct
    local.get $str
    call $check_if_null
    i32.const 4
    i32.add
    i32.load
    local.get $tmp
    i32.const 4
    call $i32_assign_to_struct
    local.get $str
    call $check_if_null
    i32.const 8
    i32.add
    i32.load
    call $main_string_copy
    local.get $tmp
    i32.const 8
    call $i32_assign_to_struct
    local.get $str
    call $check_if_null
    i32.const 12
    i32.add
    i32.load
    local.get $tmp
    i32.const 12
    call $i32_assign_to_struct
    local.get $tmp
    return
    i32.const 0
    return
  )

  (func $main_string_length (param $str i32) (result i32)
   (local $current i32)
   (local $str_length i32)
  (local $tmp i32)

    local.get $str
    local.set $current

    i32.const 0
    local.set $str_length

    (loop $loop1
      local.get $current
      i32.const 0
      i32.eq
      i32.const -1
      i32.mul
      i32.const 1
      i32.add
      if
        local.get $str_length
        local.get $current
        call $check_if_null
        i32.const 4
        i32.add
        i32.load
        i32.add
        local.set $str_length
        local.get $current
        call $check_if_null
        i32.const 8
        i32.add
        i32.load
        local.set $current
        br $loop1
      end
    )

    local.get $str_length
    return
    i32.const 0
    return
  )

  (func $main_string_delete (param $str i32)
   (local $current i32)
   (local $temp i32)
  (local $tmp i32)

    local.get $str
    local.set $current

    (loop $loop1
      local.get $current
      i32.const 0
      i32.eq
      i32.const -1
      i32.mul
      i32.const 1
      i32.add
      if
        local.get $current
        call $check_if_null
        i32.const 8
        i32.add
        i32.load
        local.set $temp
        local.get $current
        call $check_if_null
        i32.const 12
        i32.add
        i32.load
        i32.const 0
        i32.eq
        if
          local.get $current
          call $check_if_null
          i32.const 0
          i32.add
          i32.load
          call $delete_i32_array
        end
        local.get $current
        call $delete_struct
        local.get $temp
        local.set $current
        br $loop1
      end
    )
    i32.const 0
    return
  )

  (func $print_int (param $a i32)
   (local $str i32)
  (local $tmp i32)

    local.get $a
    call $itos
    local.set $str

    local.get $str
    call $string_print

    local.get $str
    call $main_string_delete
    i32.const 0
    return
  )

  (func $print_double (param $a f64)
   (local $str i32)
  (local $tmp i32)

    local.get $a
    call $dtos
    local.set $str

    local.get $str
    call $string_print

    local.get $str
    call $main_string_delete
    i32.const 0
    return
  )

  (func $print_bool (param $boolean i32)
   (local $t i32)
   (local $f i32)
  (local $tmp i32)

    local.get $boolean
    if
      i32.const 16
      call $main_string_ini
      local.set $t
      local.get $t
      call $string_print
      local.get $t
      call $main_string_delete
    else
      i32.const 36
      call $main_string_ini
      local.set $f
      local.get $f
      call $string_print
      local.get $f
      call $main_string_delete
    end
    i32.const 0
    return
  )



  (func $main_main
   (local $main_main_main0_b i32)
   (local $main_main_main0_c i32)
  (local $tmp i32)

    i32.const 60
    call $main_string_ini
    local.set $main_main_main0_b

    local.get $main_main_main0_b
    i32.const 0
    call $get
    local.set $main_main_main0_c
    i32.const 0
    return
  )

)